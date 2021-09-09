import { useRouter } from "next/router";
import { forwardRef } from "react";

function Link({ href, children, ...rest }, ref) {
  const router = useRouter();

  const handleRouting = (e) => {
    e.preventDefault();
    const clicked = e.target;
    const href = clicked.getAttribute("href");
    href && router.push(href);
  };

  return (
    <a href={href || ""} {...rest} onClick={handleRouting} ref={ref}>
      {children}
    </a>
  );
}

export default forwardRef(Link);
