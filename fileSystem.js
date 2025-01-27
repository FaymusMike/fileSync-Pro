class FileSystem {
  constructor() {
    this.fileSystem = JSON.parse(localStorage.getItem("fileSystem")) || { "/": {} }
  }

  createFolder(path, folderName) {
    const folder = this.getFolder(path)
    folder[folderName] = { type: "folder", content: {} }
    this.save()
  }

  uploadFile(path, file) {
    const folder = this.getFolder(path)
    folder[file.name] = {
      type: "file",
      size: file.size,
      lastModified: file.lastModified,
      mimeType: file.type,
    }
    this.save()
  }

  deleteItem(path, itemName) {
    const folder = this.getFolder(path)
    delete folder[itemName]
    this.save()
  }

  getFolder(path) {
    return path
      .split("/")
      .filter(Boolean)
      .reduce((acc, folder) => {
        return acc[folder].content
      }, this.fileSystem)
  }

  generateShareLink(path) {
    const shareId = uuid.v4()
    const sharedFolders = JSON.parse(localStorage.getItem("sharedFolders")) || {}
    sharedFolders[shareId] = path
    localStorage.setItem("sharedFolders", JSON.stringify(sharedFolders))
    return `${window.location.origin}?share=${shareId}`
  }

  getSharedFolder(shareId) {
    const sharedFolders = JSON.parse(localStorage.getItem("sharedFolders")) || {}
    return sharedFolders[shareId]
  }

  save() {
    localStorage.setItem("fileSystem", JSON.stringify(this.fileSystem))
  }
}

const fileSystem = new FileSystem()

