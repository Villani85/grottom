"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { isDemoMode, hasFirebaseClientConfig } from "@/lib/env"
import { initializeFirebase, getFirebaseAuth } from "@/lib/firebase-client"
import type { User } from "@/lib/types"
import type { User as FirebaseUser } from "firebase/auth"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Demo user for when Firebase is not configured
const DEMO_USER: User = {
  uid: "demo-user",
  email: "demo@example.com",
  nickname: "Demo User",
  pointsTotal: 150,
  subscriptionStatus: "active",
  isManualSubscription: false,
  isAdmin: true,
  marketingOptIn: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile data from Firestore
  const fetchUserProfile = async (uid: string): Promise<User | null> => {
    if (isDemoMode) {
      return { ...DEMO_USER, uid }
    }

    try {
      // Try to fetch from Firestore directly (client-side)
      const { getUserFromFirestore } = await import("@/lib/firestore-client")
      const firestoreUser = await getUserFromFirestore(uid)
      
      if (firestoreUser) {
        console.log("[AuthContext] User loaded from Firestore:", {
          uid: firestoreUser.uid,
          email: firestoreUser.email,
          nickname: firestoreUser.nickname,
          isAdmin: firestoreUser.isAdmin,
        })
        return firestoreUser
      }

      // Fallback to API if Firestore read fails
      console.log("[AuthContext] Firestore read failed, trying API...")
      const response = await fetch(`/api/users/${uid}`)
      if (!response.ok) {
        console.warn("[AuthContext] API also failed, creating default user")
        // Return default user structure if both fail
        return {
          uid,
          email: "",
          nickname: "User",
          pointsTotal: 0,
          subscriptionStatus: "none",
          isManualSubscription: false,
          isAdmin: false, // Default to non-admin
          marketingOptIn: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
      const apiUser = await response.json()
      console.log("[AuthContext] User loaded from API:", {
        uid: apiUser.uid,
        isAdmin: apiUser.isAdmin,
      })
      return apiUser
    } catch (error) {
      console.error("[AuthContext] Error fetching user profile:", error)
      // Return default user structure on error
      return {
        uid,
        email: "",
        nickname: "User",
        pointsTotal: 0,
        subscriptionStatus: "none",
        isManualSubscription: false,
        isAdmin: false, // Default to non-admin
        marketingOptIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      // Check if we should use demo mode
      if (isDemoMode) {
        console.warn("[AuthContext] ⚠️ Demo mode active - NEXT_PUBLIC_DEMO_MODE=true or Firebase Client config missing")
        console.warn("[AuthContext] Config values:", {
          NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
          hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          apiKeyLength: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "missing",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
        })
        setUser(DEMO_USER)
        setIsLoading(false)
        return
      }

      // Check if Firebase Client config is valid
      if (!hasFirebaseClientConfig) {
        console.warn("[AuthContext] ⚠️ Firebase Client config invalid - using demo mode")
        console.warn("[AuthContext] Config check:", {
          apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          apiKeyLength: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0,
          authDomainValue: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "missing",
          projectIdValue: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
        })
        setUser(DEMO_USER)
        setIsLoading(false)
        return
      }

      try {
        console.log("[AuthContext] Initializing Firebase...")
        // Initialize Firebase
        await initializeFirebase()
        
        // Wait a bit for Firebase to fully initialize
        await new Promise((resolve) => setTimeout(resolve, 100))
        
        let auth = getFirebaseAuth()

        if (!auth) {
          console.warn("[AuthContext] Firebase Auth not available after initialization - retrying...")
          // Retry once after a short delay
          await new Promise((resolve) => setTimeout(resolve, 500))
          auth = getFirebaseAuth()
          if (!auth) {
            console.warn("[AuthContext] Firebase Auth still not available - using demo mode")
            setUser(DEMO_USER)
            setIsLoading(false)
            return
          }
          console.log("[AuthContext] Firebase Auth available after retry")
        } else {
          console.log("[AuthContext] Firebase Auth initialized successfully")
        }

        // Verify auth is available before setting up listener
        if (!auth) {
          console.warn("[AuthContext] Firebase Auth is null, cannot set up auth state listener")
          setUser(DEMO_USER)
          setIsLoading(false)
          return
        }

        // Import Firebase Auth functions
        const { onAuthStateChanged } = await import("firebase/auth")

        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("[AuthContext] 🔐 Auth state changed:", firebaseUser ? `✅ User logged in: ${firebaseUser.uid}` : "❌ User logged out")
          if (firebaseUser) {
            setFirebaseUser(firebaseUser)
            console.log("[AuthContext] 📥 Fetching user profile for:", firebaseUser.uid)
            const userProfile = await fetchUserProfile(firebaseUser.uid)
            if (userProfile) {
              console.log("[AuthContext] ✅ User profile loaded successfully:", {
                uid: userProfile.uid,
                nickname: userProfile.nickname,
                email: userProfile.email,
                isAdmin: userProfile.isAdmin,
                pointsTotal: userProfile.pointsTotal,
              })
              setUser(userProfile)
            } else {
              console.warn("[AuthContext] ⚠️ User profile is null, creating default...")
              // Create default user if profile doesn't exist
              const defaultUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                nickname: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                pointsTotal: 0,
                subscriptionStatus: "none" as const,
                isManualSubscription: false,
                isAdmin: false,
                marketingOptIn: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              console.log("[AuthContext] 📝 Created default user:", defaultUser)
              setUser(defaultUser)
            }
          } else {
            console.log("[AuthContext] 👋 User logged out")
            setFirebaseUser(null)
            setUser(null)
          }
          setIsLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("[AuthContext] Firebase initialization error:", error)
        setUser(DEMO_USER)
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    if (isDemoMode) {
      console.log("[AuthContext] Demo login successful")
      setUser({ ...DEMO_USER, email })
      return
    }

    if (!hasFirebaseClientConfig) {
      console.warn("[AuthContext] Firebase Client config invalid - using demo login")
      setUser({ ...DEMO_USER, email })
      return
    }

    try {
      // Ensure Firebase is initialized
      await initializeFirebase()
      const auth = getFirebaseAuth()
      
      if (!auth) {
        console.error("[AuthContext] Firebase Auth not initialized - falling back to demo")
        setUser({ ...DEMO_USER, email })
        return
      }

      console.log("[AuthContext] Attempting Firebase login for:", email)
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("[AuthContext] Login successful:", userCredential.user.uid)
      
      setFirebaseUser(userCredential.user)
      const userProfile = await fetchUserProfile(userCredential.user.uid)
      setUser(userProfile)
    } catch (error: any) {
      console.error("[AuthContext] Login error:", error)
      // Re-throw with user-friendly message
      const errorMessage = error.code === "auth/user-not-found" 
        ? "Utente non trovato"
        : error.code === "auth/wrong-password"
        ? "Password errata"
        : error.code === "auth/invalid-email"
        ? "Email non valida"
        : error.message || "Errore durante il login"
      throw new Error(errorMessage)
    }
  }

  const register = async (email: string, password: string, nickname: string) => {
    if (isDemoMode) {
      console.log("[AuthContext] Demo registration successful")
      setUser({ ...DEMO_USER, email, nickname })
      return
    }

    if (!hasFirebaseClientConfig) {
      console.warn("[AuthContext] Firebase Client config invalid - using demo registration")
      setUser({ ...DEMO_USER, email, nickname })
      return
    }

    try {
      // Ensure Firebase is initialized
      await initializeFirebase()
      const auth = getFirebaseAuth()
      
      if (!auth) {
        console.error("[AuthContext] Firebase Auth not initialized - falling back to demo")
        setUser({ ...DEMO_USER, email, nickname })
        return
      }

      console.log("[AuthContext] Attempting Firebase registration for:", email)
      const { createUserWithEmailAndPassword } = await import("firebase/auth")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("[AuthContext] Registration successful:", userCredential.user.uid)
      
      setFirebaseUser(userCredential.user)

      // Create user profile in Firestore directly (client-side)
      try {
        console.log("[AuthContext] Creating user profile in Firestore...")
        const { createUserInFirestore } = await import("@/lib/firestore-client")
        
        // Auto-admin: First user or specific email becomes admin
        // Check if this is the first user by counting existing users
        let isFirstUser = false
        try {
          const { getFirebaseFirestore } = await import("@/lib/firebase-client")
          const db = getFirebaseFirestore()
          if (db) {
            const { collection, getDocs } = await import("firebase/firestore")
            const usersSnapshot = await getDocs(collection(db, "users"))
            isFirstUser = usersSnapshot.empty
          }
        } catch (e) {
          console.log("[AuthContext] Could not check if first user:", e)
        }

        // Auto-admin logic: first user OR specific admin emails
        const ADMIN_EMAILS = [
          "stefania.chiaradia@antihater.it",
          "servizi.villani@gmail.com",
          // Add more admin emails here
        ]
        const shouldBeAdmin = isFirstUser || ADMIN_EMAILS.includes(email.toLowerCase())

        const newUser = await createUserInFirestore({
          uid: userCredential.user.uid,
          email,
          nickname,
          pointsTotal: 0,
          subscriptionStatus: "none",
          isManualSubscription: false,
          isAdmin: shouldBeAdmin, // Auto-admin for first user or admin emails
          marketingOptIn: false,
        })

        if (newUser) {
          console.log("[AuthContext] User profile created in Firestore successfully")
          setUser(newUser)
        } else {
          console.warn("[AuthContext] Firestore creation returned null, trying API fallback...")
          // If Firestore creation fails, try API fallback
          try {
            const response = await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: userCredential.user.uid,
                email,
                nickname,
              }),
            })

            if (response.ok) {
              console.log("[AuthContext] User profile created via API")
              const userProfile = await fetchUserProfile(userCredential.user.uid)
              if (userProfile) {
                setUser(userProfile)
              } else {
                // If fetchUserProfile returns null, create default user
                console.warn("[AuthContext] fetchUserProfile returned null, using default user")
                setUser({
                  uid: userCredential.user.uid,
                  email,
                  nickname,
                  pointsTotal: 0,
                  subscriptionStatus: "none",
                  isManualSubscription: false,
                  isAdmin: false,
                  marketingOptIn: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
              }
            } else {
              console.warn("[AuthContext] API creation failed, using default user")
              // If both fail, set basic user
              setUser({
                uid: userCredential.user.uid,
                email,
                nickname,
                pointsTotal: 0,
                subscriptionStatus: "none",
                isManualSubscription: false,
                isAdmin: false,
                marketingOptIn: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            }
          } catch (apiError) {
            console.error("[AuthContext] API fallback error:", apiError)
            // Set basic user as last resort
            setUser({
              uid: userCredential.user.uid,
              email,
              nickname,
              pointsTotal: 0,
              subscriptionStatus: "none",
              isManualSubscription: false,
              isAdmin: false,
              marketingOptIn: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        }
      } catch (profileError) {
        console.error("[AuthContext] Profile creation error:", profileError)
        // Still set basic user even if profile creation fails
        // This ensures user can still use the app
        setUser({
          uid: userCredential.user.uid,
          email,
          nickname,
          pointsTotal: 0,
          subscriptionStatus: "none",
          isManualSubscription: false,
          isAdmin: false,
          marketingOptIn: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } catch (error: any) {
      console.error("[AuthContext] Registration error:", error)
      throw new Error(error.message || "Registration failed")
    }
  }

  const logout = async () => {
    if (isDemoMode) {
      console.log("[AuthContext] Demo logout")
      setUser(DEMO_USER)
      setFirebaseUser(null)
      return
    }

    try {
      const auth = getFirebaseAuth()
      if (auth) {
        const { signOut } = await import("firebase/auth")
        await signOut(auth)
        console.log("[AuthContext] Logout successful")
      }
      setFirebaseUser(null)
      setUser(null)
    } catch (error) {
      console.error("[AuthContext] Logout error:", error)
      // Still clear user state even if logout fails
      setFirebaseUser(null)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    if (isDemoMode) {
      setUser(DEMO_USER)
      return
    }

    if (firebaseUser) {
      const userProfile = await fetchUserProfile(firebaseUser.uid)
      setUser(userProfile)
    }
  }

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
