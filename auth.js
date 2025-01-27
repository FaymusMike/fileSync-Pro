class Auth {
  constructor() {
    this.users = JSON.parse(localStorage.getItem("users")) || []
    this.currentUser = JSON.parse(localStorage.getItem("currentUser")) || null
  }

  signup(username, password, isAdmin = false) {
    if (this.users.some((user) => user.username === username)) {
      throw new Error("Username already exists")
    }
    const newUser = { id: uuid.v4(), username, password, isAdmin }
    this.users.push(newUser)
    localStorage.setItem("users", JSON.stringify(this.users))
    return newUser
  }

  login(username, password) {
    const user = this.users.find((user) => user.username === username && user.password === password)
    if (user) {
      this.currentUser = user
      localStorage.setItem("currentUser", JSON.stringify(user))
      return user
    }
    throw new Error("Invalid username or password")
  }

  logout() {
    this.currentUser = null
    localStorage.removeItem("currentUser")
  }

  isLoggedIn() {
    return this.currentUser !== null
  }

  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin
  }
}

const auth = new Auth()

