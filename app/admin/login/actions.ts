"use server"

import { cookies } from "next/headers"

export async function loginAdmin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return { error: "Admin password not configured. Please set ADMIN_PASSWORD environment variable." }
  }

  if (password !== adminPassword) {
    return { error: "Invalid password" }
  }

  // Set a secure HTTP-only cookie for admin session
  const cookieStore = await cookies()
  cookieStore.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })

  // Return success - client will handle redirect
  return { success: true }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  return { success: true }
}

export async function checkAdminSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return session?.value === "authenticated"
}
