import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";

export default function Index() {
  const router = useRouter();

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
