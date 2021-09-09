import Logo from "./logo";
import Spinner from "./spinners";

export default function Preloader() {
  return (
    <div id="preloader">
      <div>
        <Logo />
        <Spinner />
      </div>
    </div>
  );
}
