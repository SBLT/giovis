import headercss from "@css/dashboard/layout.module.css";
import Icon from "components/icons";
import { useAuth } from "provider/auth";
import Dropdown from "components/dropdown";
import { auth } from "db/firebase";
import Link from "components/links";

export default function Header() {
  const { user } = useAuth();

  const signout = () => {
    auth.signOut().catch((error) => console.log(error));
  };

  return (
    <>
      {/* <div className={headercss.searchbar}>
          <Icon name="search@border" />
          <input type="text" placeholder="Buscar en Giovi's Admin" />
        </div> */}

      <nav>
        <Dropdown origin="bottom-end">
          <>
            {!user?.avatar && <Icon name="profile@broken" />}

            {user?.avatar && (
              <img
                className={headercss.avatar}
                src={user?.avatar}
                alt={user?.username}
              />
            )}

            <span className={headercss.username}>
              {user?.username?.split(" ")[0] || "Usuario"}
            </span>
          </>

          <div className={headercss.setup}>
            <div className={headercss.setup_avatar}>
              {user?.avatar && (
                <img src={user?.avatar} alt={user?.username || "Usuario"} />
              )}

              {!user?.avatar && <Icon name="profile@bold" />}

              <div>
                <p>{user?.username || "Usuario"}</p>
                <span>{user?.email}</span>
              </div>
            </div>

            <hr />

            <Link href="/home">
              <Icon name="arrow-left@bold" />
              Volver al inicio
            </Link>

            <button onClick={() => signout()}>
              <Icon name="logout@bold" />
              Cerrar sesión
            </button>
          </div>
        </Dropdown>
      </nav>
    </>
  );
}
