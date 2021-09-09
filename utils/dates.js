const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const getDateFromMilliseconds = (milliseconds) => {
  let date = new Date(milliseconds);

  let seconds = date.getSeconds();
  let minutes = date.getMinutes();
  let hour = date.getHours();

  let year = date.getFullYear();
  let month = date.getMonth(); // beware: January = 0; February = 1, etc.
  let day = date.getDate();

  let dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, etc.
  let milliSeconds = date.getMilliseconds();

  return {
    date: new Date(milliseconds),
    seconds: seconds,
    minutes: minutes,
    hour: hour,
    milliseconds: milliSeconds,
    year: {
      int: parseInt(year),
      firstday: new Date(year, 0, 1),
      lastday: new Date(year + 1, 0, 0),
    },
    month: {
      id: ("0" + (month + 1)).slice(-2),
      int: parseInt(month) + 1,
      name: MONTHS[parseInt(month)]?.toLocaleLowerCase(),
      firstday: new Date(year, month, 1),
      lastday: new Date(year, month + 1, 0),
    },
    day: {
      id: ("0" + day).slice(-2),
      int: parseInt(day),
      name: DAYS[parseInt(dayOfWeek)]?.toLocaleLowerCase(),
    },
    week: {
      firstday: new Date(date.setDate(date.getDate() - date.getDay())),
      lastday: new Date(date.setDate(date.getDate() - date.getDay() + 6)),
    },
  };
};
