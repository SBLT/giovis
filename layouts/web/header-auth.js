import Dropdown from "components/dropdown";
import Button from "components/buttons";
import Input from "components/inputs";
import Icon from "components/icons";
import authcss from "@css/web/layout.module.css";
import { useState, useEffect, useRef } from "react";
import { auth, db, googleProvider } from "db/firebase";
import useWindowSize from "hooks/useWindowSize";
import Portal from "components/portals";
import { toast } from "components/toasts";

export default function HeaderAuth() {
  const { width } = useWindowSize();
  const setup_ref = useRef(null);
  const [authAction, setAuthAction] = useState("signin");
  const [isSetupPopupOpen, setIsSetupPopupOpen] = useState(false);
  const [inputState, setInputState] = useState({
    email: {
      value: "",
      error: false,
    },
    password: {
      value: "",
      error: false,
    },
  });

  const regex = {
    email:
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
    password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])\w{8,}$/,
  };

  const handleInputChange = (e) => {
    const { value, name } = e.target;
    if (value?.[0] == " ") return;

    if (regex?.[name]?.test(value)) {
      setInputState({
        ...inputState,
        [name]: {
          value: value,
          error: false,
        },
      });
    } else {
      setInputState({
        ...inputState,
        [name]: {
          value: value,
          error: true,
        },
      });
    }
  };

  const signInWithGoogle = () => {
    auth
      .signInWithPopup(googleProvider)
      .then((userCredential) => {
        const isNewUser = userCredential.additionalUserInfo.isNewUser;
        const userSettings = {
          email: userCredential.user.email,
          username: userCredential.user.displayName,
          avatar: userCredential.user.photoURL,
        };

        if (isNewUser) {
          db.collection("users")
            .doc(userCredential.user.uid)
            .set(userSettings)
            .catch((error) => console.error(error));
        }
      })
      .catch((err) => console.error(err));
  };

  const signInOrSignUp = () => {
    if (inputState?.email?.value == "" && inputState?.password?.value == "") {
      setInputState({
        ...inputState,
        email: { ...inputState.email, error: true },
        password: { ...inputState.password, error: true },
      });

      return toast({
        value: "!Ups! Debe completar todos los campos",
        type: "error",
      });
    }

    if (inputState?.email?.value == "") {
      setInputState({
        ...inputState,
        email: { ...inputState.email, error: true },
      });

      return toast({
        value: "!Ups! Olvidó incluir el email",
        type: "error",
      });
    }

    if (inputState?.password?.value == "") {
      setInputState({
        ...inputState,
        password: { ...inputState.password, error: true },
      });

      return toast({
        value: "!Ups! Olvidó incluir la contraseña",
        type: "error",
      });
    }

    if (!regex?.email?.test(inputState?.email?.value)) {
      setInputState({
        ...inputState,
        email: { ...inputState.email, error: true },
      });

      toast({
        value: "!Ups! El email que ha ingresado no es válido",
        type: "error",
      });

      return setTimeout(() => {
        return toast({
          value: "ejemplo@gmail.com",
          type: "info",
        });
      }, 2000);
    }

    if (!regex?.password?.test(inputState?.password?.value)) {
      setInputState({
        ...inputState,
        password: { ...inputState.password, error: true },
      });

      toast({
        value: "!Ups! La contraseña que ha ingresado no es válido",
        type: "error",
      });

      return setTimeout(() => {
        return toast({
          value: "Su contraseña debe incluir mayúsculas, minúsculas y números",
          type: "info",
        });
      }, 2000);
    }

    if (authAction === "signin") {
      auth
        .signInWithEmailAndPassword(
          inputState?.email?.value,
          inputState?.password?.value
        )
        .catch((error) => {
          switch (error.code) {
            case "auth/user-not-found":
              createAccount(
                inputState?.email?.value,
                inputState?.password?.value
              );
              break;

            default:
              console.log(error);
          }
        });
    }

    if (authAction === "signup") {
      createAccount(inputState?.email?.value, inputState?.password?.value);
    }
  };

  const createAccount = (email, password) => {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const userSettings = {
          email: userCredential.user.email,
        };

        db.collection("users")
          .doc(userCredential.user.uid)
          .set(userSettings)
          .catch((error) => console.error(error));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    setIsSetupPopupOpen(false);
    setAuthAction("signin");
    setInputState({
      email: {
        value: "",
        error: false,
      },
      password: {
        value: "",
        error: false,
      },
    });
  }, [width]);

  return (
    <>
      {width > 720 ? (
        <Dropdown origin="bottom-end">
          <Button variant="outlined">Comienza gratis</Button>

          <div className={authcss.auth}>
            <p>Usa una de tus redes</p>

            <div className={authcss.social}>
              <Button
                variant="outlined"
                color="nephritis"
                onClick={signInWithGoogle}
              >
                <Icon name="google" />
                Google
              </Button>
            </div>

            <p>O usa tu correo electrónico</p>

            <form className={authcss.form}>
              <label>Correo electrónico</label>
              <Input
                placeholder="Correo electrónico"
                name="email"
                state={inputState?.email?.error ? "is-error" : null}
                onChange={(e) => handleInputChange(e)}
                value={inputState?.email?.value}
              />

              <label>Contraseña</label>
              <Input
                type="password"
                placeholder="Contraseña"
                name="password"
                state={inputState?.password?.error ? "is-error" : null}
                onChange={(e) => handleInputChange(e)}
                value={inputState?.password?.value}
              />

              <Button size="large" onClick={() => signInOrSignUp()}>
                {authAction == "signin" && "Iniciar sesión"}
                {authAction == "signup" && "Registrarse"}
              </Button>
            </form>

            <footer className={authcss.footer}>
              {authAction == "signin" && (
                <>
                  <p>
                    ¿No tienes una cuenta?
                    <button onClick={() => setAuthAction("signup")}>
                      Registrarse gratis
                    </button>
                  </p>
                </>
              )}

              {authAction == "signup" && (
                <p>
                  ¿Ya tienes cuenta?
                  <button onClick={() => setAuthAction("signin")}>
                    Iniciar sesión
                  </button>
                </p>
              )}
            </footer>
          </div>
        </Dropdown>
      ) : (
        <>
          {isSetupPopupOpen ? (
            <Portal>
              <div
                className="alert"
                onClick={(e) => {
                  if (!setup_ref.current?.contains(e.target)) {
                    setIsSetupPopupOpen(false);
                  }
                }}
              >
                <div
                  className={authcss.auth}
                  ref={setup_ref}
                  style={{
                    width: "calc(100vw - 2rem)",
                    maxWidth: "25rem",
                  }}
                >
                  <p>Usa una de tus redes</p>

                  <div className={authcss.social}>
                    <Button
                      variant="outlined"
                      color="nephritis"
                      onClick={signInWithGoogle}
                    >
                      <Icon name="google" />
                      Google
                    </Button>
                  </div>

                  <p>O usa tu correo electrónico</p>

                  <form className={authcss.form}>
                    <label>Correo electrónico</label>
                    <Input
                      placeholder="Correo electrónico"
                      name="email"
                      state={inputState?.email?.error ? "is-error" : null}
                      onChange={(e) => handleInputChange(e)}
                      value={inputState?.email?.value}
                    />

                    <label>Contraseña</label>
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      name="password"
                      state={inputState?.password?.error ? "is-error" : null}
                      onChange={(e) => handleInputChange(e)}
                      value={inputState?.password?.value}
                    />

                    <Button size="large" onClick={() => signInOrSignUp()}>
                      {authAction == "signin" && "Iniciar sesión"}
                      {authAction == "signup" && "Registrarse"}
                    </Button>
                  </form>

                  <footer className={authcss.footer}>
                    {authAction == "signin" && (
                      <>
                        <p>
                          ¿No tienes una cuenta?
                          <button onClick={() => setAuthAction("signup")}>
                            Registrarse gratis
                          </button>
                        </p>

                        <a href="">¿Olvidaste tu contraseña?</a>
                      </>
                    )}

                    {authAction == "signup" && (
                      <p>
                        ¿Ya tienes cuenta?
                        <button onClick={() => setAuthAction("signin")}>
                          Iniciar sesión
                        </button>
                      </p>
                    )}
                  </footer>
                </div>
              </div>
            </Portal>
          ) : null}

          <button onClick={() => setIsSetupPopupOpen(true)}>
            <Icon name="profile@broken" />
          </button>
        </>
      )}
    </>
  );
}
