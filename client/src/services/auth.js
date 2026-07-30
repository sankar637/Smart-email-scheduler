import { signInWithPopup, signOut, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import api from "./api";

// export async function loginWithGoogle() {
//   const result = await signInWithPopup(auth, googleProvider);
//   return await exchangeToken(result);
// }

export async function loginWithGoogle() {
  console.log("Step 1: opening Google popup...");
  const result = await signInWithPopup(auth, googleProvider);
  console.log("Step 2: popup resolved, got user:", result.user.email);

  const idToken = await result.user.getIdToken();
  console.log("Step 3: got ID token, calling backend...");

  const { data } = await api.post("/auth/google", { idToken });
  console.log("Step 4: backend responded:", data);

  localStorage.setItem("appToken", data.token);
  localStorage.setItem("appUser", JSON.stringify(data.user));
  return data.user;
}

// Call this once when the app boots, in case popup silently fell back to redirect
export async function checkRedirectResult() {
  const result = await getRedirectResult(auth);
  if (result) {
    return await exchangeToken(result);
  }
  return null;
}

async function exchangeToken(result) {
  const idToken = await result.user.getIdToken();
  const { data } = await api.post("/auth/google", { idToken });
  localStorage.setItem("appToken", data.token);
  localStorage.setItem("appUser", JSON.stringify(data.user));
  return data.user;
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem("appToken");
  localStorage.removeItem("appUser");
}

export function getStoredUser() {
  const raw = localStorage.getItem("appUser");
  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem("appToken"));
}