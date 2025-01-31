/**
 * Logs informational messages to the console with optional details.
 *
 * @function logInfo
 * @param {string} message - The informational message to log.
 * @param {Object} [details={}] - Additional details to include with the log message.
 */
function logInfo(message, details = {}) {
    console.log(`[INFO] ${message}`, Object.keys(details).length ? details : '')
}


/**
 * Logs error messages to the console with optional error details.
 *
 * @function logError
 * @param {string} message - The error message to log.
 * @param {Error|string} error - The error object or message to include with the log.
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
 * Initializes the database and its collections for use.
 *
 * @async
 * @function connectDatabase
 * @throws Will log an error if the connection to the database fails.
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
 * @param {string} email - The email address of the user to update.
 * @param {Object} updates - An object containing the fields to update and their new values.
 * @throws Will log an error if the update operation fails.
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
 * @param {string} userId - The unique ID of the user to retrieve.
 * @returns {Object|null} The user object if found, or `null` if not found.
 * @throws Will log an error if the retrieval operation fails.
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
 * Retrieves a user from the database by their email address.
 *
 * @async
 * @function getUserByEmail
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Object|null} The user object if found, or `null` if not found.
 * @throws Will log an error if the retrieval operation fails.
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
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Object|null} The user object if found, or `null` if not found.
 * @throws Will log an error if the retrieval operation fails.
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
 * @param {Object} user - The user object to be inserted into the database.
 * @returns {string|null} The ID of the newly created user, or `null` if the operation fails.
 * @throws Will log an error if the user creation operation fails.
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
 * Stores a key with an expiry time for a specific user in the database.
 *
 * @async
 * @function storeKey
 * @param {string} email - The email of the user to associate with the key.
 * @param {string} key - The key to be stored.
 * @throws Will log an error if the key storage operation fails.
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
 * Retrieves a user from the database by a specific key and type.
 *
 * @async
 * @function getUserByKey
 * @param {string} key - The key to search for.
 * @returns {Object|null} The user object if found and the key is valid, or `null` if not found or expired.
 * @throws Will log an error if the retrieval operation fails.
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
 * Updates the password for a user in the database.
 *
 * @async
 * @function updatePassword
 * @param {string} email - The email of the user whose password should be updated.
 * @param {string} newPassword - The new password to set for the user.
 * @returns {boolean} `true` if the password was successfully updated, `false` otherwise.
 * @throws Will log an error if the password update operation fails.
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
 * Saves a session object to the database.
 *
 * @async
 * @function saveSession
 * @param {Object} session - The session object to be saved, including properties like sessionKey and other metadata.
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
 * Retrieves a session from the database by its session key.
 *
 * @async
 * @function getSession
 * @param {string} key - The session key used to retrieve the session.
 * @returns {Object|null} The session data if found and valid, or `null` if not found or expired.
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
 * Deletes a session from the database by its session key.
 *
 * @async
 * @function deleteSession
 * @param {string} key - The session key of the session to be deleted.
 * @throws Will log an error if the session deletion operation fails.
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
 * Updates the data of an existing session in the database by its session key.
 *
 * @async
 * @function updateSession
 * @param {string} key - The session key of the session to be updated.
 * @param {Object} data - The data to be merged into the existing session data.
 * @throws Will log an error if the session update operation fails.
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


module.exports = {
    updateUserField,
    getUserById, getUserByUsername, getUserByEmail, getUserByType,
    createUser,
    storeKey, getUserByKey, clearKey,
    updatePassword,
    saveSession, getSession, deleteSession, updateSession,

}