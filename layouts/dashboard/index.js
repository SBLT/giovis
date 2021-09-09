import { useRouter } from "next/router";
import { useAuth } from "provider/auth";
import boardcss from "@css/dashboard/layout.module.css";
import Sidebar from "./sidebar";
import Header from "./header";
import Preloader from "components/preloaders";

export default function Board({ children }) {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  if (isLoading) return <Preloader />;
  else if (user === null || user?.role == undefined) {
    router.push("/home");
    return <></>;
  } else {
    return (
      <div className={boardcss.app}>
        <div className={boardcss.sidebar}>
          <Sidebar />
        </div>

        <div className={boardcss.header}>
          <Header />
        </div>

        <div className={boardcss.content}>{children}</div>
      </div>
    );
  }
}
