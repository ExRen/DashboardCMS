/**
 * Centralized User Data
 * Data pengguna yang digunakan untuk mention dan assignment
 */

export const USERS = [
    { id: 1, name: "Admin", role: "Administrator", email: "admin@asabri.co.id" },
    { id: 2, name: "Corcomm Team", role: "Content Creator", email: "corcomm@asabri.co.id" },
    { id: 3, name: "Humas ASABRI", role: "PR Manager", email: "humas@asabri.co.id" },
    { id: 4, name: "Design Team", role: "Designer", email: "design@asabri.co.id" },
    { id: 5, name: "Social Media", role: "Social Media Manager", email: "socmed@asabri.co.id" },
    { id: 6, name: "Marketing", role: "Marketing", email: "marketing@asabri.co.id" },
    { id: 7, name: "Legal", role: "Legal Compliance", email: "legal@asabri.co.id" },
]

/**
 * Get user by ID
 */
export function getUserById(id) {
    return USERS.find(u => u.id === id)
}

/**
 * Get user by name
 */
export function getUserByName(name) {
    return USERS.find(u => u.name === name)
}

/**
 * Search users by query
 */
export function searchUsers(query) {
    if (!query) return USERS
    return USERS.filter(u => 
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.role.toLowerCase().includes(query.toLowerCase())
    )
}

export default USERS
