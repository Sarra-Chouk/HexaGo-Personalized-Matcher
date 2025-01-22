const { ObjectId } = require('mongodb')
const express = require("express")
const business = require("./business.js")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const handlebars = require("express-handlebars")
const fileUpload = require('express-fileupload')
let app = express()

const hbs = handlebars.create({
    helpers: {
        ifEquals: (arg1, arg2, options) => {
            return (arg1 === arg2) ? options.fn(this) : options.inverse(this)
        },
        formatDate: function(date) {
            const options = { hour: '2-digit', minute: '2-digit', hour12: true }
            return new Date(date).toLocaleTimeString([], options)
        }
    }
})

app.set("views", __dirname + "/templates")
app.set("view engine", "handlebars")
app.engine("handlebars", hbs.engine)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use('/profilePictures', express.static(__dirname + "/static/profilePictures"))
app.use('/badges', express.static(__dirname + '/static/badges'))
app.use('/images', express.static(__dirname + '/static'))
app.use(fileUpload())


/**
 * Route handler for the "/" page.
 * Redirects to the the "index" route.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get("/", (req, res) => {
    res.redirect("/index")
})


/**
 * Route handler for the "/index" page.
 * Renders the "index" view.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get("/index", (req, res) => {
    res.render("index")
})


/**
 * Route handler for the "/sign-up-student" page.
 * Renders the student "signup" view and passes a message from the query string.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.query.message - The message from the query string.
 */
app.get("/sign-up-student", async (req, res) => {
    const message = req.query.message
    res.render("signupStudent", { message}) 
})


/**
 * Route handler for the "/sign-up-student" page (POST).
 * Handles user registration, validates input, and stores user data.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.body.username - The user's chosen username.
 * @param {string} req.body.email - The user's email address.
 * @param {string} req.body.password - The user's password.
 * @param {string} req.body.confirmedPassword - The user's confirmed password.
 * @param {Array<string>} req.body.knownLanguages - List of languages the user speaks fluently.
 * @throws {Error} If validation fails for any of the input fields.
 * 
 * @returns {void} Redirects to the login page with a success message upon successful registration.
 */
app.post("/sign-up-student", async (req, res) => {
    const { username, email, password, nationality, country, city, needs, knownLanguages, 
        confirmedPassword, category, field, gpa
    } = req.body


     const knownLanguagesArray = knownLanguages
        ? Array.isArray(knownLanguages)
            ? knownLanguages.filter((lang) => lang && lang.trim() !== "")
            : [knownLanguages].filter((lang) => lang && lang.trim() !== "")
        : []

    try {

        const isEmailValid = await business.validateEmail(email)
        const isPasswordValid = await business.validatePassword(password)

        if (!isEmailValid) {
            throw new Error("Invalid or already registered email address.")
        }

        if (!isPasswordValid) {
            throw new Error("Password must be at least 8 characters, include a number, a special character, an uppercase and lowercase letter.")
        }

        if (confirmedPassword.trim() != password.trim()) {
            throw new Error("The passwords you entered do not match. Please ensure both password fields are the same.")
        }

        if (knownLanguagesArray.length === 0) {
            throw new Error("Please select at least one language you speak fluently.")
        }

        const type = "Student"
        user = {
            username, email, password, knownLanguages, nationality, country, city, needs, 
            type, category, field, gpa
        }
        console.log(user)
        await business.createUser(user)
        res.redirect(`/login?message=${encodeURIComponent("Registration successful.")}&type=success`)

    }

    catch (error) {

        console.error("Signup error:", error.message)
        res.redirect("/sign-up-student?message=" + encodeURIComponent(error.message))

    }
})


/**
 * Route handler for the "/sign-up-student" page.
 * Renders the university "signup" view and passes a message from the query string.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.query.message - The message from the query string.
 */
app.get("/sign-up-university", async (req, res) => {
    const message = req.query.message
    res.render("signupUniversity", { message}) 
})


/**
 * Route handler for the "/sign-up-university" page (POST).
 * Handles university account registration, validates input, and stores user data.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.body.username - The user's chosen username.
 * @param {string} req.body.email - The user's email address.
 * @param {string} req.body.password - The user's password.
 * @param {string} req.body.confirmedPassword - The user's confirmed password.
 * 
 * @throws {Error} If validation fails for any of the input fields.
 * 
 * @returns {void} Redirects to the login page with a success message upon successful registration.
 */
app.post("/sign-up-university", async (req, res) => {
    const { username, email, password, confirmedPassword, country, city, services, 
        formData, minGPA
    } = req.body

    const degreeFields = [];
    console.log(formData)
    // Step 2: Loop through formData to extract program, field, and languages per index
    let index = 1;
    while (formData && formData[`program${index}`] !== undefined){
        const program = formData[`program${index}`];
        const field = formData[`field${index}`];

        // Collect all languages for the current index
        const languages = formData[`languages${index}`];
        const languageArray = Array.isArray(languages) ? languages : [languages];

        // Group them into an object and push to the array
        degreeFields.push({
            program,
            field,
            languages: languageArray,
        });

        index++;
    }

    try {

        const isEmailValid = await business.validateEmail(email)
        const isPasswordValid = await business.validatePassword(password)

        if (!isEmailValid) {
            throw new Error("Invalid or already registered email address.")
        }

        if (!isPasswordValid) {
            throw new Error("Password must be at least 8 characters, include a number, a special character, an uppercase and lowercase letter.")
        }

        if (confirmedPassword.trim() != password.trim()) {
            throw new Error("The passwords you entered do not match. Please ensure both password fields are the same.")
        }

        const type = "University"
        user = {
            username, email, password, country, city, services, degreeFields, minGPA, type
        }
        await business.createUser(user)
        res.redirect(`/login?message=${encodeURIComponent("Registration successful.")}&type=success`)

    }

    catch (error) {

        console.error("Signup error:", error.message)
        res.redirect("/sign-up-university?message=" + encodeURIComponent(error.message))

    }
})


/**
 * Route handler for the "/reset-password" page.
 * Renders the password reset page with optional message and type parameters from the query string.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.query.message - Optional message to be displayed on the reset password page.
 * @param {string} req.query.type - Optional type to define the message style (success/error).
 * 
 * @returns {void} Renders the "resetPassword" view with message and type.
 */
app.get("/reset-password", async (req, res) => {
    const message = req.query.message
    const type = req.query.type
    res.render("resetPassword", { message, type })
})


/**
 * Route handler for the "/reset-password" page (POST).
 * Initiates the password reset process by checking if the email exists, storing a reset key, and sending a password reset email.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.body.email - The email address provided by the user for password reset.
 * 
 * @throws {Error} If any error occurs during the reset process.
 * 
 * @returns {void} Redirects to the reset password page with a success or error message.
 */
app.post("/reset-password", async (req, res) => {
    const email = req.body.email

    try {

        const emailExists = await business.checkEmailExists(email)

        if (!emailExists) {
            return res.redirect(`/reset-password?message=${encodeURIComponent('Invalid or not registered email address.')}&type=error`)
        }

        const resetKey = await business.storeResetKey(email)
        await business.sendPasswordResetEmail(email, resetKey)
        res.redirect(`/reset-password?message=${encodeURIComponent('Password reset email sent. Please check your inbox.')}&type=success`)

    } catch (error) {

        console.error("Error in reset password process:", error.message)
        return res.redirect(`/reset-password?message=${encodeURIComponent('An unexpected error occurred. Please try again.')}&type=error`)

    }
})


/**
 * Route handler for the "/update-password" page.
 * Renders the update password page with the reset key, message, and type from the query string.
 * Validates the reset key and checks if it is associated with an existing user.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.query.key - The password reset key used for verification.
 * @param {string} req.query.message - Optional message to display on the page.
 * @param {string} req.query.type - Optional type to define the message style (success/error).
 * 
 * @throws {Error} If the reset key is invalid or expired, or if an unexpected error occurs.
 * 
 * @returns {void} Renders the "updatePassword" view or redirects with an error message.
 */
app.get("/update-password", async (req, res) => {
    const resetKey = req.query.key
    const message = req.query.message
    const type = req.query.type

    try {

        const user = await business.getUserByResetKey(resetKey)

        if (!user) {
            return res.redirect(`/update-password?message=${encodeURIComponent("Your reset link is invalid or has expired. Please request a new link.")}&type=error`)
        }

        res.render('updatePassword', { resetKey, message, type })
    } catch (error) {

        console.error("Error fetching reset key:", error.message)
        res.redirect(`/update-password?message=${encodeURIComponent("An unexpected error occurred. Please try again.")}&type=error`)

    }
})


/**
 * Route handler for the "/update-password" page (POST).
 * Handles the password reset process by validating the reset key, new password, and confirmation, then updating the user's password.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.body.resetKey - The reset key used for password update.
 * @param {string} req.body.csrfToken - The CSRF token for security validation.
 * @param {string} req.body.newPassword - The new password chosen by the user.
 * @param {string} req.body.confirmedPassword - The confirmation of the new password.
 * 
 * @throws {Error} If any error occurs during the password reset process.
 * 
 * @returns {void} Redirects to the login page with a success or error message.
 */
app.post("/update-password", async (req, res) => {
    const { resetKey, csrfToken, newPassword, confirmedPassword } = req.body

    try {
        
        const resetResult = await business.resetPassword(resetKey, newPassword, confirmedPassword)

        if (!resetResult.isValid) {
            return res.redirect(`/update-password?key=${resetKey}&message=${encodeURIComponent(resetResult.message)}&type=error`)
        }

        res.redirect(`/login?message=${encodeURIComponent("Password reset successful. Please log in with your new password.")}&type=success`)

    } catch (error) {

        console.error("Error in update password process:", error.message);
        res.redirect(`/update-password?key=${resetKey}&message=${encodeURIComponent("An unexpected error occurred. Please try again.")}&type=error`)

    } 
})


/**
 * Route handler for the "/login" page.
 * Renders the login page with optional message and type parameters from the query string.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.query.message - Optional message to display on the login page.
 * @param {string} req.query.type - Optional type to define the message style (success/error).
 * 
 * @returns {void} Renders the "login" view with message and type.
 */
app.get("/login", (req, res) => {
    const message = req.query.message
    const type = req.query.type
    res.render("login", { message, type })
})


/**
 * Route handler for the "/login" page (POST).
 * Handles the login process by validating the user's credentials and starting a session.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.body.email - The user's email address.
 * @param {string} req.body.password - The user's password.
 * 
 * @throws {Error} If any error occurs during the login process.
 * 
 * @returns {void} Redirects to the dashboard page with a success or error message.
 */
app.post("/login", async (req, res) => {
    const { email, password, type } = req.body

    try {

        const loginResult = await business.checkLogin(email, password)

        if (!loginResult.isValid) {
            return res.redirect(`/login?message=${encodeURIComponent(loginResult.message)}&type=error`)
        }

        if(type == "University") {
            res.send("This page is currently under construction! try again later.")
            return
        }

        const sessionKey = await business.startSession(loginResult.userId)
        res.cookie("sessionKey", sessionKey, { httpOnly: true })
        res.redirect("/myMatches?message=" + encodeURIComponent("Welcome to HexaGo!") + "&type=success")

    } catch (error) {

        console.error("Login error:", error.message)
        res.redirect("/login?message=" + encodeURIComponent("An unexpected error occurred. Please try again."))
    }
})


/**
 * Middleware to attach session data to the request object.
 * Verifies the session key from cookies and fetches the session data.
 * If the session is invalid or expired, the user is redirected to the login page.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function to be executed if the session is valid.
 * 
 * @throws {Error} If there is an error fetching session data or if the session is invalid or expired.
 * 
 * @returns {void} Redirects to the login page with an appropriate message if the session is invalid or expired.
 */
async function attachSessionData(req, res, next) {
    const sessionKey = req.cookies.sessionKey
    if (!sessionKey) {
        return res.redirect(`/login?message=${encodeURIComponent("Please log in.")}&type=error`)
    }

    try {

        const sessionData = await business.getSession(sessionKey)
        if (!sessionData || !sessionData.userId) {
            return res.redirect(`/login?message=${encodeURIComponent("Your session has expired. Please log in again.")}&type=error`)
        }
        req.userId = sessionData.userId
        next()

    } catch (error) {

        console.error("Error in attachSessionData middleware:", error.message)
        res.redirect("/login?message=" + encodeURIComponent("An error occurred. Please try again.") + "&type=error")

    }
}


/**
 * Route handler for the "/dashboard" page.
 * Fetches and renders the dashboard with the user's data, including matching users.
 * Requires session data, validated by the `attachSessionData` middleware.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.query.message - Optional message to display on the dashboard page.
 * @param {string} req.query.type - Optional type to define the message style (success/error).
 * @param {string} req.userId - The ID of the currently logged-in user, extracted from session data.
 * 
 * @throws {Error} If any error occurs while fetching user data or matching users.
 * 
 * @returns {void} Renders the "dashboard" view with user and matching user data.
 */
app.get("/myMatches", attachSessionData, async (req, res) => {
    try {
        const message = req.query.message
        const type = req.query.type
        const userId = req.userId
        const user = await business.getUserById(userId)

        res.render("myMatches")

    } catch (err) {

        console.error("Error fetching dashboard data:", err.message)
        res.status(500).send("An error occurred while loading your dashboard.")

    }
})


app.get("/profile", attachSessionData, async (req, res) => {
    try {
        const userId = req.userId;
        const profile = await business.getProfile(userId);

        // Render the profile view and pass all the required data
        res.render("profile", {
            username: profile.username,
            email: profile.email,
            profilePicture: profile.profilePicture,
            badges: profile.badges,
            nationality: profile.nationality,
            country: profile.country,
            city: profile.city,
            knownLanguages: profile.knownLanguages,
            needs: profile.needs,
            educationLevel: profile.educationLevel,
            studyField: profile.studyField,
            gpa: profile.gpa
        });
    } catch (error) {
        console.error("Error rendering profile:", error.message);
        res.status(500).send("An error occurred while loading your profile.");
    }
});


/**
 * Route handler for the "/logout" page.
 * Logs the user out by canceling the session token and clearing the session data.
 * Redirects to the login page with a success message.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {string} req.cookies.sessionKey - The session key from the cookies.
 * 
 * @throws {Error} If any error occurs while logging out or managing session data.
 * 
 * @returns {void} Redirects to the login page with a success or error message.
 */
app.get("/logout", async (req, res) => {
    const sessionKey = req.cookies.sessionKey

    try {

        if (sessionKey) {
            await business.cancelToken(sessionKey)
            await business.deleteSession(sessionKey)
            res.clearCookie("sessionKey")
        }

        res.redirect(`/login?message=${encodeURIComponent("You have been logged out.")}&type=success`)

    } catch (error) {

        console.error("Logout error:", error.message)
        res.redirect("/dashboard?message=" + encodeURIComponent("An unexpected error occurred. Please try again."))

    }
})

app.listen(8000, () => { })