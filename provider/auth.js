import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "db/firebase";

const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  /*
   * Save the user data in a state
   *
   * User === undefined ==> No one logged out or logged in
   * User === null ==> Someone logged out
   * User === {} ==> A user is logged in
   */
  const [user, setUser] = useState(undefined);
  const [uid, setUid] = useState();
  const [loadingState, setLoadingState] = useState("is-loading");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setLoadingState("is-loading");

      if (user) {
        setUid(user.uid);
      } else {
        setUser(null);
        setUid(-1);
        setLoadingState("is-loaded");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (uid == -1) return;

    const unsubscribe = db
      .collection("users")
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setUser({ ...doc.data(), uid: uid });
            setTimeout(() => setLoadingState("is-loaded"), 2000);
          } else {
            setUser(null);
            setLoadingState("is-loaded");
          }
        },
        (error) => {
          console.error(error);
          setUser(null);
          setLoadingState("is-loaded");
        }
      );

    return () => unsubscribe();
  }, [uid]);

  const values = {
    user,
    isLoading: loadingState === "is-loading" ? true : false,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
}
