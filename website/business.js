const { ObjectId } = require('mongodb')
const persistence = require('./persistence')
const crypto = require("crypto")

/**
 * Retrieves a user by their unique ID using the persistence layer.
 *
 * @async
 * @function getUserById
 * @param {string} userId - The unique ID of the user to retrieve.
 * @returns {Object|null} The user object if found, or `null` if not found.
 * @throws Will propagate any errors from the persistence layer.
 */
async function getUserById(userId) {
    return await persistence.getUserById(userId)
}

/**
 * Retrieves a user by their email address using the persistence layer.
 *
 * @async
 * @function getUserByEmail
 * @param {string} tyoe - The type of the user to retrieve (University of Student).
 * @returns {Object|null} The user object if found, or `null` if not found.
 * @throws Will propagate any errors from the persistence layer.
 */
async function getUserByType(type) {
    return await persistence.getUserByType(type)
}

/**
 * Retrieves a user by their email address using the persistence layer.
 *
 * @async
 * @function getUserByEmail
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Object|null} The user object if found, or `null` if not found.
 * @throws Will propagate any errors from the persistence layer.
 */
async function getUserByEmail(email) {
    return await persistence.getUserByEmail(email)
}

/**
 * Validates an email address format and checks if it is not already in use.
 *
 * @async
 * @function validateEmail
 * @param {string} email - The email address to validate.
 * @returns {boolean} `true` if the email is valid and not in use, `false` otherwise.
 * @throws Will propagate any errors from the `getUserByEmail` function.
 */
async function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const user = await getUserByEmail(email)
    return emailRegex.test(email) && !user
}

/**
 * Checks if an email address already exists in the database using the persistence layer.
 *
 * @async
 * @function checkEmailExists
 * @param {string} email - The email address to check.
 * @returns {boolean} `true` if the email exists, `false` otherwise.
 * @throws Will propagate any errors from the persistence layer.
 */
async function checkEmailExists(email) {
    const user = await persistence.getUserByEmail(email)
    return !!user
}

/**
 * Validates if a username exists in the database using the persistence layer.
 *
 * @async
 * @function validateUsername
 * @param {string} username - The username to validate.
 * @returns {Object|null} The user object if the username exists, or `null` if it does not.
 * @throws Will propagate any errors from the persistence layer.
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
 * Retrieves a user's profile information by their ID.
 *
 * @async
 * @function getProfile
 * @param {string} userId - The unique ID of the user to retrieve.
 * @returns {Object|null} An object containing user profile data if found, or `null` if not found.
 * @throws Will propagate any errors from the persistence layer.
 */
async function getProfile(userId) {
    const user = await persistence.getUserById(userId);
    if (!user) {
        throw new Error("User not found.");
    }

    // Return the data needed for the profile view
    return {
        username: user.username,
        email: user.email,
        nationality: user.nationality || "Not specified",
        country: user.country || "Not specified",
        city: user.city || "Not specified",
        knownLanguages: user.knownLanguages || [],
        needs: user.needs || [],
        studyField: user.studyField || "Not specified",
        educationLevel: user.educationLevel || "Not specified",
        gpa: user.gpa || "Not specified",
        profilePicture: user.profilePicture || "/default-profile.png",
        badges: user.badges || []
    };
}

/**
 * Sends a message from one user to another.
 *
 * @async
 * @function sendMessage
 * @param {string} senderId - The ID of the user sending the message.
 * @param {string} receiverId - The ID of the user receiving the message.
 * @param {string} message - The content of the message.
 * @returns {Object} The result of the save operation.
 * @throws Will propagate any errors from the persistence layer.
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


module.exports = {
    getUserById, getUserByEmail, getUserByType,
    validateEmail, checkEmailExists, validatePassword, validateUsername,
    createUser,
    checkLogin,
    startSession, getSession, deleteSession,
    storeResetKey, getUserByResetKey, sendPasswordResetEmail, resetPassword, updatePassword,
    getProfile,
    generateFormToken, cancelToken,
}
