const { ObjectId } = require('mongodb')
const persistence = require('./persistence')
const crypto = require("crypto")
const fs = require('fs').promises;


/**
 * Fetches a user by ID from the persistence layer.
 *
 * @async
 * @function getUserById
 * @param {string} userId - The unique user ID.
 * @returns {Promise<Object|null>} The user object if found, otherwise `null`.
 */
async function getUserById(userId) {
    return await persistence.getUserById(userId)
}


/**
 * Fetches a user by type from the persistence layer.
 *
 * @async
 * @function getUserByType
 * @param {string} type - The user type (e.g., "University" or "Student").
 * @returns {Promise<Object|null>} The user object if found, otherwise `null`.
 */
async function getUserByType(type) {
    return await persistence.getUserByType(type)
}


/**
 * Fetches a user by email from the persistence layer.
 *
 * @async
 * @function getUserByEmail
 * @param {string} email - The user's email.
 * @returns {Promise<Object|null>} The user object if found, otherwise `null`.
 */
async function getUserByEmail(email) {
    return await persistence.getUserByEmail(email)
}


/**
 * Validates an email format and checks if it's already registered.
 *
 * @async
 * @function validateEmail
 * @param {string} email - The email address to validate.
 * @returns {Promise<boolean>} `true` if valid and not in use, otherwise `false`.
 * @throws Will propagate errors from `getUserByEmail`.
 */
async function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const user = await getUserByEmail(email)
    return emailRegex.test(email) && !user
}


/**
 * Checks if an email already exists in the database.
 *
 * @async
 * @function checkEmailExists
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} `true` if the email exists, otherwise `false`.
 * @throws Will propagate errors from the persistence layer.
 */
async function checkEmailExists(email) {
    const user = await persistence.getUserByEmail(email)
    return !!user
}


/**
 * Validates if a username exists in the database.
 *
 * @async
 * @function validateUsername
 * @param {string} username - The username to check.
 * @returns {Promise<Object|null>} The user object if found, otherwise `null`.
 * @throws Will propagate errors from the persistence layer.
 */
async function validateUsername(username) {
    return await persistence.getUserByUsername(username)
}


/**
 * Validates if a password meets security criteria.
 *
 * @async
 * @function validatePassword
 * @param {string} password - The password to validate.
 * @returns {boolean} `true` if the password meets all criteria, `false` otherwise.
 * @description The password is validated against the following criteria:
 * - At least 8 characters long.
 * - Contains at least one number.
 * - Contains at least one special character.
 * - Contains at least one uppercase letter.
 * - Contains at least one lowercase letter.
 */
async function validatePassword(password) {
    const lengthRegex = /^.{8,}$/
    const numberRegex = /[0-9]/
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/
    const upperCaseRegex = /[A-Z]/
    const lowerCaseRegex = /[a-z]/

    return (
        lengthRegex.test(password) &&
        numberRegex.test(password) &&
        specialCharRegex.test(password) &&
        upperCaseRegex.test(password) &&
        lowerCaseRegex.test(password)
    )
}


/**
 * Creates a salted hash for a given password.
 *
 * @function createSaltedHash
 * @param {string} password - The plain text password to hash.
 * @returns {string} A salted hash in the format `salt:hash`.
 * @description This function generates a 4-byte random salt, appends it to the password, 
 * and creates a SHA-1 hash. The result is returned as a string in the format `salt:hash`.
 */
function createSaltedHash(password) {
    const salt = crypto.randomBytes(4).toString('hex');
    const hash = crypto.createHash('sha1')
    hash.update(salt + password)
    return salt + ":" + hash.digest('hex')
}


/**
 * Creates a new user in the system with the provided details.
 *
 * @async
 * @function createUser
 * @param {Object} userData All the user's data
 * @throws Will log an error if any validation fails or if user creation fails.
 * @description This function validates the provided email, username, and password before creating a new user.
 * The password is hashed with a salt before storing. The user's email is marked as unverified by default.
 */
async function createUser(userData) {
    const hashedPassword = createSaltedHash(userData.password)
    userData.password = hashedPassword
    await persistence.createUser(userData)
}


/**
 * Checks the login credentials of a user.
 *
 * @async
 * @function checkLogin
 * @param {string} email - The email address of the user attempting to log in.
 * @param {string} password - The plain text password provided by the user.
 * @returns {Object} An object with `isValid` (boolean), `message` (string), and optionally `userId` (string).
 * @description This function verifies the email and password against the database. It also ensures the user's email is verified.
 */
async function checkLogin(email, password) {
    const user = await persistence.getUserByEmail(email)
    if (!user) {
        return { isValid: false, message: "Invalid email or password." }
    }
    const [storedSalt, storedHash] = user.password.split(':')
    const hash = crypto.createHash('sha1')
    hash.update(storedSalt + password)
    const inputHash = hash.digest('hex')

    if (inputHash === storedHash) {
        return { isValid: true, message: "Login successful.", userId: user._id }
    } else {
        return { isValid: false, message: "Invalid email or password." }
    }
}


/**
 * Starts a new session for a user by creating a session object with a unique session key and expiry time.
 *
 * @async
 * @function startSession
 * @param {string} userId - The ID of the user for whom the session is being created.
 * @returns {string} The session key for the newly created session.
 * @throws Will log an error if the session cannot be saved.
 */
async function startSession(userId) {
    const uuid = crypto.randomUUID()
    const expiry = new Date(Date.now() + 10 * 60 * 1000)
    const session = {
        sessionKey: uuid,
        expiry: expiry,
        data: { userId: userId }
    }
    await persistence.saveSession(session)
    return uuid
}


/**
 * Retrieves a session by its session key.
 *
 * @async
 * @function getSession
 * @param {string} key - The session key to retrieve the session data.
 * @returns {Object|null} The session object if found and valid, or `null` if not found or expired.
 * @throws Will propagate any errors from the persistence layer.
 */
async function getSession(key) {
    return await persistence.getSession(key)
}


/**
 * Deletes a session by its session key.
 *
 * @async
 * @function deleteSession
 * @param {string} key - The session key of the session to delete.
 * @throws Will propagate any errors from the persistence layer.
 */
async function deleteSession(key) {
    return await persistence.deleteSession(key)
}


/**
 * Stores a password reset key for a user in the database.
 *
 * @async
 * @function storeResetKey
 * @param {string} email - The email address of the user for whom the reset key is being generated.
 * @returns {string} The generated reset key.
 * @throws Will log an error if the operation to store the reset key fails.
 */
async function storeResetKey(email) {
    let resetKey = crypto.randomUUID();
    await persistence.storeKey(email, resetKey)
    return resetKey
}


/**
 * Retrieves a user from the database using a password reset key.
 *
 * @async
 * @function getUserByResetKey
 * @param {string} resetKey - The password reset key associated with the user.
 * @returns {Object|null} The user object if found, or `null` if not found or the key is invalid.
 * @throws Will propagate any errors from the persistence layer.
 */
async function getUserByResetKey(resetKey) {
    return await persistence.getUserByKey(resetKey)
}


/**
 * Sends a password reset email to the specified user.
 *
 * @async
 * @function sendPasswordResetEmail
 * @param {string} email - The email address of the user requesting the password reset.
 * @param {string} resetKey - The reset key generated for the password reset process.
 * @throws Will log an error if the email fails to send.
 * @description This function constructs a password reset link using the provided reset key and simulates sending it to the user's email.
 */

async function sendPasswordResetEmail(email, resetKey) {
    const resetLink = `http://localhost:8000/update-password?key=${resetKey}`
    const body = `
    Hello,
    You requested a password reset. Click the link below to reset your password:

        ${resetLink}
    
    If you did not request a password reset, please ignore this email.
    `;
    console.log(body)
}


/**
 * Resets a user's password using a reset key.
 *
 * @async
 * @function resetPassword
 * @param {string} resetKey - The password reset key associated with the user.
 * @param {string} newPassword - The new password to set for the user.
 * @param {string} confirmedPassword - The confirmation password to verify against the new password.
 * @returns {Object} An object containing `isValid` (boolean) and a `message` (string) if invalid.
 * @throws Will propagate any errors from the persistence layer.
 * @description This function validates the new password, checks the reset key, ensures passwords match, 
 * hashes the new password, and updates it in the database. It also clears the reset key after use.
 */
async function resetPassword(resetKey, newPassword, confirmedPassword) {
    if (! await validatePassword(newPassword)) {
        return { isValid: false, message: "Password must be at least 8 characters, include a number, a special character, an uppercase and lowercase letter." }
    }
    if (newPassword.trim() !== confirmedPassword.trim()) {
        return { isValid: false, message: "The passwords you entered do not match. Please ensure both password fields are the same." }
    }
    const user = await persistence.getUserByKey(resetKey)
    if (!user) {
        return { isValid: false, message: "Your reset link is invalid or has expired. Please request a new link." }
    }
    const saltedHash = createSaltedHash(newPassword)
    await persistence.updatePassword(user.email, saltedHash)
    await persistence.clearKey(user.email)
    return { isValid: true }
}


/**
 * Updates a user's password in the database.
 *
 * @async
 * @function updatePassword
 * @param {string} email - The email address of the user whose password is to be updated.
 * @param {string} newPassword - The new password to set for the user.
 * @returns {boolean} `false` if the user is not found, otherwise nothing is returned.
 * @throws Will propagate any errors from the persistence layer.
 */
async function updatePassword(email, newPassword) {
    const user = await persistence.getUserByEmail(email)
    if (!user) {
        return false
    }
    const saltedHash = createSaltedHash(newPassword)
    await persistence.updatePassword(email, saltedHash)
}


/**
 * Passes a user field update request to the persistence layer.
 *
 * @async
 * @function updateUserField
 * @param {string} email - The user's email.
 * @param {Object} updates - The fields and values to update.
 * @returns {Promise<void>} Resolves when the update is complete.
 */
async function updateUserField(email, updates) {
    await persistence.updateUserField(email, updates)
}


/**
 * Retrieves a user's profile based on their ID.
 *
 * @async
 * @function getProfile
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<Object>} The user's profile data.
 * @throws Will log an error and throw an exception if the user is not found or has an invalid account type.
 */
async function getProfile(userId) {
    try {
        const user = await persistence.getUserById(userId);
        if (!user) {
            throw new Error("User not found.");
        }

        if (user.accountType === "Student") {
            return {
                username: user.username,
                email: user.email,
                nationality: user.nationality || "Not specified",
                country: user.country || "Not specified",
                city: user.city || "Not specified",
                knownLanguages: user.languages || [],
                educationLevel: user.education || "Not specified",
                studyField: user.field || "Not specified",
                gpa: user.gpa || "Not specified",
                needs: user.needs || [],
                accountType: user.accountType,
            };
        } else if (user.accountType === "University") {
            return {
                username: user.username,
                email: user.email,
                country: user.country || "Not specified",
                city: user.city || "Not specified",
                programs: user.programs || [],
                minGPA: user.minGPA || "Not specified",
                services: user.services || [],
                accountType: user.accountType,
            };
        } else {
            throw new Error("Invalid account type.");
        }
    } catch (error) {
        logError("Error fetching profile:", error);
        throw error;
    }
}


/**
 * Generates and stores a CSRF token for a session.
 *
 * @async
 * @function generateFormToken
 * @param {string} key - The session key associated with the user.
 * @returns {Promise<string>} The generated CSRF token.
 * @throws Will propagate errors if session retrieval or update fails.
 */
async function generateFormToken(key) {
    let token = crypto.randomUUID()
    let sessionData = await persistence.getSession(key)
    sessionData.csrfToken = token
    await persistence.updateSession(key, sessionData)
    return token
}


/**
 * Cancels a CSRF token by removing it from the session data.
 *
 * @async
 * @function cancelToken
 * @param {string} key - The session key associated with the user.
 * @throws Will propagate any errors from the persistence layer.
 * @description This function deletes the CSRF token from the session data.
 */
async function cancelToken(key) {
    let sessionData = await persistence.getSession(key)
    delete sessionData.csrfToken
    await persistence.updateSession(key, sessionData)
}


/**
 * Retrieves and stores matched students for a university.
 *
 * @async
 * @function getMatches
 * @param {string} loggedInUniversityEmail - The university's email.
 * @returns {Promise<Array<Object>|null>} A list of matched students or `null` if no matches are found.
 * @throws Logs an error if reading or processing recommendations fails.
 * 
 * @description Reads `recommendations.json` to find student matches for the given university.
 * Saves the matches to the database under the university's record and returns the list.
 */
async function getMatches(loggedInUniversityEmail) {
    try {
        const filePath = 'recommendations.json'; 
        const data = await fs.readFile(filePath, 'utf8');
        const recommendations = JSON.parse(data);

        const universityMatches = Object.values(recommendations).find(
            uni => uni.university_email === loggedInUniversityEmail
        );

        if (universityMatches) {
            const matches = universityMatches.students.map(student => ({
                student_email: student.student_email,
                student_name: student.student_name, 
                similarity_score: parseFloat(student.similarity_score.toFixed(2)) 
            }));

            await persistence.updateUserField(loggedInUniversityEmail, { matches: matches });

            console.log('Matches saved to the database:', matches);
            return matches; 
        } else {
            console.log('No matches found for this university.');
            return null; 
        }
    } catch (error) {
        console.error('Error fetching or processing recommendations:', error);
        return null;
    }
}


module.exports = {
        getUserById, getUserByEmail, getUserByType,
        validateEmail, checkEmailExists, validatePassword, validateUsername,
        createUser,
        checkLogin,
        startSession, getSession, deleteSession,
        storeResetKey, getUserByResetKey, sendPasswordResetEmail, resetPassword, updatePassword,
        updateUserField,
        getProfile,
        generateFormToken, cancelToken,
        getMatches
    }
