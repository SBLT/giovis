import { useEffect, useRef } from "react";
import Head from "next/head";

export default function Custom404() {
  const router = useRef(null);

  useEffect(() => {
    router.push("/home");
  }, []);

  return (
    <>
      <Head>
        <title>Giovis</title>
        <link rel="icon" href="/logo_icon.png" />
      </Head>
    </>
  );
}
