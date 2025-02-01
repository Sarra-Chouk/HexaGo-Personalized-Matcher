/**
 * Logs an informational message to the console.
 *
 * @function logInfo
 * @param {string} message - The message to log.
 * @param {Object} [details={}] - Optional additional details to include.
 */
function logInfo(message, details = {}) {
    console.log(`[INFO] ${message}`, Object.keys(details).length ? details : '')
}


/**
 * Logs an error message to the console.
 *
 * @function logError
 * @param {string} message - The error message to log.
 * @param {Error|string} error - The error object or string message.
 */
function logError(message, error) {
    console.error(`[ERROR] ${message}`, error?.message || error)
}


const { MongoClient, ObjectId, DBRef } = require('mongodb')
let client = undefined
let db = undefined
let users = undefined
let sessions = undefined


//sarra : mongodb+srv://60300372:INFS3201@infs3201.9arv1.mongodb.net/
//manahil : mongodb+srv://60302181:12class34@cluster0.yrpo2.mongodb.net/
/**
 * Establishes a connection to the MongoDB database if not already connected.
 * Initializes the database and collections.
 *
 * @async
 * @function connectDatabase
 * @throws Will log an error if the database connection fails.
 */
async function connectDatabase() {
    if (!client) {
        try {
            client = new MongoClient('mongodb+srv://60300372:INFS3201@infs3201.9arv1.mongodb.net/')
            await client.connect()
            db = client.db("HexaGo")
            users = db.collection("users")
            sessions = db.collection('sessions')
            logInfo("Connected to the database.")
        } catch (error) {
            logError("Failed to connect to the database", error)
        }
    }
}


/**
 * Updates specific fields of a user in the database based on their email.
 *
 * @async
 * @function updateUserField
 * @param {string} email - The email of the user to update.
 * @param {Object} updates - The fields and values to update.
 * @returns {Promise<void>}
 * @throws Will log an error if the update fails.
 */
async function updateUserField(email, updates) {
    try {
        await connectDatabase()
        const result = await users.updateOne(
            { email: email },
            { $set: updates })
        if (result.modifiedCount > 0) {
            logInfo(`User with email ${email} updated successfully.`)
        } else {
            logInfo(`No updates made for user with email ${email}`)
        }
    } catch (error) {
        logError("Error updating user field", error)
    }
}


/**
 * Retrieves a user from the database by their unique ID.
 *
 * @async
 * @function getUserById
 * @param {string} userId - The unique user ID.
 * @returns {Promise<Object|null>} The user object if found, otherwise `null`.
 * @throws Will log an error if the operation fails.
 */
async function getUserById(userId) {
    try {
        await connectDatabase()
        const user = await users.findOne({ _id: new ObjectId(userId) })
        if (user) {
            logInfo(`Fetched user by ID: ${userId}`)
        } else {
            logInfo(`User not found by ID: ${userId}`)
        }
        return user
    } catch (error) {
        logError("Error fetching user by ID", error)
    }
}


/**
 * Retrieves a user from the database by their type.
 *
 * @async
 * @function getUserByType
 * @param {string} type - The user type to search for.
 * @returns {Promise<Object|null>} The user object if found, otherwise `null`.
 * @throws Will log an error if the operation fails.
 */
async function getUserByType(type) {
    try {
        await connectDatabase()
        const user = await users.findOne({ type })
        if (user) {
            logInfo(`Fetched users by type: ${type}`)
        } else {
            logInfo(`Users not found by type: ${type}`)
        }
        return user
    } catch (error) {
        logError("Error fetching user by email", error)
    }
}


/**
 * Retrieves a user from the database by their email address.
 *
 * @async
 * @function getUserByEmail
 * @param {string} email - The email address to search for.
 * @returns {Promise<Object|null>} The user object if found, otherwise `null`.
 * @throws Will log an error if the operation fails.
 */
async function getUserByEmail(email) {
    try {
        await connectDatabase()
        const user = await users.findOne({ email })
        if (user) {
            logInfo(`Fetched user by email: ${email}`)
        } else {
            logInfo(`User not found by email: ${email}`)
        }
        return user
    } catch (error) {
        logError("Error fetching user by email", error)
    }
}


/**
 * Retrieves a user from the database by their username.
 *
 * @async
 * @function getUserByUsername
 * @param {string} username - The username of the user to retrieve.
 * @returns {Object|null} The user object if found, or `null` if not found.
 * @throws Will log an error if the retrieval operation fails.
 */
async function getUserByUsername(username) {
    try {
        await connectDatabase()
        const user = await users.findOne({ username })
        if (user) {
            logInfo(`Fetched user by username: ${username}`)
        } else {
            logInfo(`User not found by username: ${username}`)
        }
        return user
    } catch (error) {
        logError("Error fetching user by username:", error)
    }
}


/**
 * Creates a new user in the database.
 *
 * @async
 * @function createUser
 * @param {Object} user - The user object to insert.
 * @returns {Promise<string|null>} The new user ID, or `null` if creation fails.
 * @throws Will log an error if the creation fails.
 */
async function createUser(user) {
    try {
        await connectDatabase()
        console.log("user: " + user)
        const result = await users.insertOne(user)
        logInfo(`User created successfully with ID: ${result.insertedId}`)
        return result.insertedId
    } catch (error) {
        logError("Error creating user", error)
    }
}


/**
 * Stores a key with an expiry time for a user in the database.
 *
 * @async
 * @function storeKey
 * @param {string} email - The user's email.
 * @param {string} key - The key to store.
 * @throws Will log an error if the operation fails.
 */
async function storeKey(email, key) {
    try {
        await connectDatabase()
        const expiry = new Date(Date.now() + 5 * 60 * 1000)
        const keyObject = { value: key, expiry }
        const result = await users.updateOne({ email }, { $set: { [`resetKey`]: keyObject } })
        if (result.modifiedCount > 0) {
            logInfo(`${type} key stored successfully for email: ${email}`)
        } else {
            logInfo(`Failed to store ${type} key: No user found with email: ${email}`)
        }
    } catch (error) {
        logError(`Error storing reset key for email: ${email} - ${error}`)
    }
}


/**
 * Retrieves a user by a reset key.
 *
 * @async
 * @function getUserByKey
 * @param {string} key - The reset key to search for.
 * @returns {Promise<Object|null>} The user object if found and valid, otherwise `null`.
 * @throws Will log an error if the operation fails.
 */
async function getUserByKey(key) {
    try {
        await connectDatabase()
        const user = await users.findOne({ [`resetKey.value`]: key })
        if (user) {
            if (user[`resetKey`].expiry > new Date()) {
                logInfo(`Fetched user by reset key successfully: key = ${key}`)
                return user
            } else {
                logInfo(`Expired reset key for user: key = ${key}`)
            }
        } else {
            logInfo(`No user found with reset key: key = ${key}`)
        }
        return null
    } catch (error) {
        logError(`Error fetching user by reset key: key = ${key} - ${error}`)
    }
}


/**
 * Clears a specific key for a user in the database.
 *
 * @async
 * @function clearKey
 * @param {string} email - The email of the user whose key should be cleared.
 * @throws Will log an error if the key clearing operation fails.
 */
async function clearKey(email) {
    try {
        await connectDatabase()
        const result = await users.updateOne({ email }, { $unset: { [`resetKey`]: "" } })
        if (result.modifiedCount > 0) {
            logInfo(`reset key cleared successfully for email: ${email}`)
        } else {
            logInfo(`Failed to clear reset key: No user found with email: ${email}`)
        }
    } catch (error) {
        logError(`Error clearing reset key for email: ${email} - ${error}`)
    }
}


/**
 * Updates a user's password in the database.
 *
 * @async
 * @function updatePassword
 * @param {string} email - The user's email.
 * @param {string} newPassword - The new hashed password.
 * @returns {Promise<boolean>} `true` if updated, `false` if no user was found.
 * @throws Logs an error if the update fails.
 */
async function updatePassword(email, newPassword) {
    try {
        await connectDatabase()
        const result = await users.updateOne({ email: email }, { $set: { password: newPassword } })
        if (result.modifiedCount > 0) {
            logInfo(`Password updated successfully for email: ${email}`)
            return true
        } else {
            logInfo(`Password update failed: No user found with email: ${email}`)
            return false
        }
    } catch (error) {
        logError(`Error updating password for email: ${email}: ${error}`)
    }
}


/**
 * Saves a new session to the database.
 *
 * @async
 * @function saveSession
 * @param {Object} session - The session object to be stored in the database.
 * @param {string} session.sessionKey - A unique key identifying the session.
 * @param {Date} session.expiry - The expiration date and time of the session.
 * @param {Object} session.data - The session data containing user-related information.
 * @returns {Promise<void>} Resolves when the session is successfully saved.
 * @throws Will log an error if the session saving operation fails.
 */
async function saveSession(session) {
    try {
        await connectDatabase()
        await sessions.insertOne(session)
        logInfo(`Session saved successfully with sessionKey: ${session.sessionKey}`)
    } catch (error) {
        logError(`Error saving session with sessionKey: ${session.sessionKey} - ${error}`)
    }
}


/**
 * Retrieves a session from the database using its session key.
 *
 * @async
 * @function getSession
 * @param {string} key - The session key used to retrieve the session data.
 * @returns {Promise<Object|null>} The session data if found and valid, otherwise `null` if not found or expired.
 * @throws Will log an error if the session retrieval operation fails.
 */
async function getSession(key) {
    try {
        await connectDatabase()
        const session = await sessions.findOne({ sessionKey: key })
        if (!session) {
            logInfo(`No session found with sessionKey: ${key}`)
            return null
        }
        if (session.expiry < new Date()) {
            logInfo(`Session expired for sessionKey: ${key}`)
            return null
        }
        logInfo(`Session retrieved successfully for sessionKey: ${key}`)
        return session.data
    } catch (error) {
        logError(`Error finding session data for sessionKey: ${key} - ${error}`)
    }
}


/**
 * Deletes a session from the database.
 *
 * @async
 * @function deleteSession
 * @param {string} key - The session key to delete.
 * @throws Will log an error if the operation fails.
 */
async function deleteSession(key) {
    try {
        await connectDatabase()
        const result = await sessions.deleteOne({ sessionKey: key })
        if (result.deletedCount === 1) {
            logInfo(`Session deleted successfully for sessionKey: ${key}`)
        } else {
            logInfo(`No session found with sessionKey: ${key}`)
        }
    } catch (error) {
        logError(`Error deleting session for sessionKey: ${key} - ${error}`)
    }
}


/**
 * Updates an existing session in the database.
 *
 * @async
 * @function updateSession
 * @param {string} key - The session key to update.
 * @param {Object} data - The updated session data.
 * @throws Will log an error if the update fails.
 */
async function updateSession(key, data) {
    try {
        await connectDatabase()
        const session = await sessions.findOne({ sessionKey: key })
        const updatedData = {
            ...session.data, 
            ...data 
        }
        await sessions.updateOne(
            { sessionKey: key },
            { $set: { data: updatedData } }
        )
        if (result.modifiedCount > 0) {
            logInfo(`Session updated successfully for sessionKey: ${key}`)
        } else {
            logInfo(`No session found or updated for sessionKey: ${key}`)
        }
    } catch (error) {
        logError(`Error updating session for sessionKey: ${key} - ${error}`)
    }
}

/**
 * Retrieves a user from the database by their unique ID.
 *
 * @async
 * @function getAllUniversities
 * @returns {Promise<[Object]|null>} The universities if found, otherwise `null`.
 * @throws Will log an error if the operation fails.
 */
async function getAllUniversities() {
    try {
        await connectDatabase()
        universities = await users.find({accountType: "University"}).toArray();
        if (universities) {
            logInfo(`Fetched all universities.`)
        } else {
            logInfo(`Universities not found.`)
        }
        return universities
    } catch (error) {
        logError("Error fetching universities", error)
    }
}


module.exports = {
    updateUserField,
    getUserById, getUserByUsername, getUserByEmail, getUserByType,
    createUser,
    storeKey, getUserByKey, clearKey,
    updatePassword,
    saveSession, getSession, deleteSession, updateSession,
    getAllUniversities,
}