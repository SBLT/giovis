import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Icon from "./icons";

const initial = {
  value: "This is a toast!",
  type: "success",
  icon: true,
  time: {
    entry: 500,
    exit: 500,
    stay: 4000,
  },
};

export function toast(data = initial) {
  const {
    icon = initial.icon,
    type = initial.type,
    value = initial.value,
    time = initial.time,
  } = data;

  const notifications = document.getElementById("notifications");
  const toast = document.createElement("div");

  // Times
  const exit_time = time && time.exit ? time.exit : initial.time.exit;
  const entry_time = time && time.entry ? time.entry : initial.time.entry;
  const stay_time = time && time.stay ? time.stay : initial.time.stay;

  // Updating toast's attributes
  toast.classList.add("toast");
  toast.setAttribute("is-icon", Boolean(icon));
  toast.setAttribute("variant", type);

  // Creating the content
  const react_content = (
    <>
      {Boolean(icon) && type == "success" && <Icon name="tick-square@broken" />}
      {Boolean(icon) && type == "error" && <Icon name="danger@broken" />}
      {Boolean(icon) && type == "info" && <Icon name="info-square@broken" />}
      {Boolean(icon) && type == "warning" && <Icon name="info-circle@broken" />}

      <div>{value}</div>
    </>
  );

  // Getting the content
  const content = renderToStaticMarkup(
    createElement(Fragment, null, react_content)
  );

  // Adding the contents to the toast
  toast.innerHTML = content;

  // Updating Styles
  toast.style.transition = "transform ease-in-out 0s";
  toast.style.transform = "translateX(150%)";

  // Rendering the toast
  notifications.insertAdjacentElement("beforeend", toast);

  // Showing the toast
  setTimeout(() => {
    toast.style.transitionDuration = `${entry_time}ms`;
    toast.style.transform = "translateX(0)";
  }, 100);

  // Removing the toast
  const remove_toast = setTimeout(() => {
    toast.style.transitionDuration = `${exit_time}ms`;
    toast.style.transform = "translateX(150%)";
    setTimeout(() => notifications?.removeChild(toast), exit_time);
  }, stay_time + 100);

  // Hover effects
  toast.addEventListener("mouseleave", () => {
    setTimeout(() => {
      toast.style.transitionDuration = `${exit_time}ms`;
      toast.style.transform = "translateX(150%)";
      setTimeout(() => notifications?.removeChild(toast), exit_time);
    }, 500);
  });

  toast.addEventListener("mouseenter", () => {
    clearTimeout(remove_toast);
  });
}
