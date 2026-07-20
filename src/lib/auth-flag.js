// src/lib/auth-flag.js
//
// localStorage key for the non-sensitive "someone is signed in here" hint.
// AuthContext writes it and the axios interceptor reads it to decide whether
// a 401 should tear the session down and hard-redirect to /login (nothing
// ever renders from it). It lives in this plain module so the api layer never
// has to import React code. The server cookie remains the source of truth -
// this is only a presence hint.
export const AUTHED_FLAG = "bethere.authed";
