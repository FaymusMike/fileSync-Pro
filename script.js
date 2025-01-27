document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app")
  let currentPath = "/"

  function renderApp() {
    if (!auth.isLoggedIn()) {
      renderAuthForm()
    } else {
      renderFileManager()
    }
  }

  function renderAuthForm(isSignup = false) {
    app.innerHTML = `
            <div class="container">
                <div class="auth-form">
                    <h2>${isSignup ? "Sign Up" : "Log In"}</h2>
                    <form id="authForm">
                        <div class="mb-3">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="username" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="password" required>
                        </div>
                        ${
                          isSignup
                            ? `
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="isAdmin">
                                <label class="form-check-label" for="isAdmin">Sign up as Admin</label>
                            </div>
                        `
                            : ""
                        }
                        <button type="submit" class="btn btn-primary">${isSignup ? "Sign Up" : "Log In"}</button>
                    </form>
                    <p class="mt-3">
                        ${isSignup ? "Already have an account?" : "Don't have an account?"}
                        <a href="#" id="switchAuthMode">${isSignup ? "Log In" : "Sign Up"}</a>
                    </p>
                </div>
            </div>
        `

    const authForm = document.getElementById("authForm")
    const switchAuthMode = document.getElementById("switchAuthMode")

    authForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const username = document.getElementById("username").value
      const password = document.getElementById("password").value
      try {
        if (isSignup) {
          const isAdmin = document.getElementById("isAdmin").checked
          auth.signup(username, password, isAdmin)
        }
        auth.login(username, password)
        renderApp()
      } catch (error) {
        alert(error.message)
      }
    })

    switchAuthMode.addEventListener("click", (e) => {
      e.preventDefault()
      renderAuthForm(!isSignup)
    })
  }

  function renderFileManager() {
    app.innerHTML = `
            <div class="container-fluid">
                <header class="row bg-primary text-white py-3">
                    <div class="col">
                        <h1 class="mb-0">FileSync Pro</h1>
                    </div>
                    <div class="col-auto">
                        <span id="sync-status" class="badge bg-success">Synced</span>
                    </div>
                    <div class="col-auto">
                        <button id="logoutBtn" class="btn btn-light">Logout</button>
                    </div>
                </header>

                <main class="row my-4">
                    <div class="col-md-8">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb" id="folder-path">
                                <li class="breadcrumb-item"><a href="#" data-path="/">Root</a></li>
                            </ol>
                        </nav>
                        <div id="file-list" class="list-group mb-3">
                            <!-- File and folder list will be populated here -->
                        </div>
                        <div class="drag-drop-zone" id="dragDropZone">
                            <p>Drag and drop files here or click to upload</p>
                            <input type="file" id="fileInput" multiple style="display: none;">
                        </div>
                        <div class="mt-3">
                            <button id="addFolderBtn" class="btn btn-secondary me-2">
                                <i class="fas fa-folder-plus"></i> New Folder
                            </button>
                            <button id="shareFolderBtn" class="btn btn-info">
                                <i class="fas fa-share-alt"></i> Share Folder
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <h2>Sync History</h2>
                        <ul id="sync-history" class="list-group">
                            <!-- Sync history will be populated here -->
                        </ul>
                    </div>
                </main>
            </div>
        `

    const logoutBtn = document.getElementById("logoutBtn")
    const addFolderBtn = document.getElementById("addFolderBtn")
    const shareFolderBtn = document.getElementById("shareFolderBtn")
    const dragDropZone = document.getElementById("dragDropZone")
    const fileInput = document.getElementById("fileInput")
    const folderPath = document.getElementById("folder-path")

    logoutBtn.addEventListener("click", () => {
      auth.logout()
      renderApp()
    })

    addFolderBtn.addEventListener("click", () => {
      const folderName = prompt("Enter folder name:")
      if (folderName) {
        fileSystem.createFolder(currentPath, folderName)
        renderFiles()
      }
    })

    shareFolderBtn.addEventListener("click", () => {
      const shareLink = fileSystem.generateShareLink(currentPath)
      alert(`Share this link: ${shareLink}`)
    })

    dragDropZone.addEventListener("click", () => fileInput.click())
    dragDropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dragDropZone.classList.add("drag-over")
    })
    dragDropZone.addEventListener("dragleave", () => {
      dragDropZone.classList.remove("drag-over")
    })
    dragDropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      dragDropZone.classList.remove("drag-over")
      handleFiles(e.dataTransfer.files)
    })

    fileInput.addEventListener("change", (e) => handleFiles(e.target.files))

    folderPath.addEventListener("click", (e) => {
      e.preventDefault()
      if (e.target.tagName === "A") {
        currentPath = e.target.dataset.path
        renderFiles()
      }
    })

    renderFiles()
    renderHistory()
  }

  function renderFiles() {
    const fileList = document.getElementById("file-list")
    fileList.innerHTML = ""
    const folder = fileSystem.getFolder(currentPath)

    for (const [name, item] of Object.entries(folder)) {
      const listItem = document.createElement("div")
      listItem.className = item.type === "folder" ? "list-group-item folder-item" : "list-group-item file-item"

      if (item.type === "folder") {
        listItem.innerHTML = `
                    <span><i class="fas fa-folder folder-icon"></i>${name}</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-danger delete-item" data-name="${name}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `
        listItem.addEventListener("click", (e) => {
          if (!e.target.closest(".btn-group")) {
            currentPath += name + "/"
            renderFiles()
          }
        })
      } else {
        listItem.innerHTML = `
                    <span><i class="fas ${getFileIcon(name)} file-icon"></i>${name}</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary download-file" data-name="${name}">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-item" data-name="${name}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `
      }
      fileList.appendChild(listItem)
    }

    renderBreadcrumb()
  }

  function renderBreadcrumb() {
    const folderPath = document.getElementById("folder-path")
    folderPath.innerHTML = '<li class="breadcrumb-item"><a href="#" data-path="/">Root</a></li>'
    const paths = currentPath.split("/").filter(Boolean)
    let currentPathBuildup = "/"
    paths.forEach((folder) => {
      currentPathBuildup += folder + "/"
      folderPath.innerHTML += `
                <li class="breadcrumb-item">
                    <a href="#" data-path="${currentPathBuildup}">${folder}</a>
                </li>
            `
    })
  }

  function renderHistory() {
    const syncHistory = document.getElementById("sync-history")
    syncHistory.innerHTML = ""
    const history = JSON.parse(localStorage.getItem("syncHistory")) || []
    history.slice(0, 5).forEach((item) => {
      const historyItem = document.createElement("li")
      historyItem.className = "list-group-item"
      historyItem.textContent = item
      syncHistory.appendChild(historyItem)
    })
  }

  function handleFiles(files) {
    for (const file of files) {
      fileSystem.uploadFile(currentPath, file)
    }
    renderFiles()
    simulateSync()
  }

  function getFileIcon(fileName) {
    const extension = fileName.split(".").pop().toLowerCase()
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "fa-image"
      case "mp4":
      case "avi":
      case "mov":
        return "fa-video"
      case "pdf":
        return "fa-file-pdf"
      case "doc":
      case "docx":
        return "fa-file-word"
      case "xls":
      case "xlsx":
        return "fa-file-excel"
      case "ppt":
      case "pptx":
        return "fa-file-powerpoint"
      default:
        return "fa-file"
    }
  }

  function simulateSync() {
    const syncStatus = document.getElementById("sync-status")
    syncStatus.textContent = "Syncing..."
    syncStatus.classList.remove("bg-success")
    syncStatus.classList.add("bg-warning", "sync-animation")

    setTimeout(() => {
      syncStatus.textContent = "Synced"
      syncStatus.classList.remove("bg-warning", "sync-animation")
      syncStatus.classList.add("bg-success")
      const history = JSON.parse(localStorage.getItem("syncHistory")) || []
      history.unshift(`Synced at ${new Date().toLocaleString()}`)
      localStorage.setItem("syncHistory", JSON.stringify(history))
      renderHistory()
    }, 2000)
  }

  // Check for shared folder link
  const urlParams = new URLSearchParams(window.location.search)
  const shareId = urlParams.get("share")
  if (shareId) {
    const sharedPath = fileSystem.getSharedFolder(shareId)
    if (sharedPath) {
      currentPath = sharedPath
    }
  }

  renderApp()
})

