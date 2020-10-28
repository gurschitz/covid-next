import { parse, isBefore } from "date-fns";

export function parseDateTime(time: string) {
  const isSummer = isBefore(
    parse(`${time} +02`, "dd.MM.yyyy HH:mm:ss X", new Date()),
    new Date(2020, 9, 25)
  );
  if (isSummer) {
    return parse(`${time} +02`, "dd.MM.yyyy HH:mm:ss X", new Date());
  } else {
    return parse(`${time} +01`, "dd.MM.yyyy HH:mm:ss X", new Date());
  }
}

export function parseDate(day: string) {
  const isSummer = isBefore(
    parse(`${day} +02`, "dd.MM.yyyy X", new Date()),
    new Date(2020, 9, 25)
  );
  if (isSummer) {
    return parse(`${day} +02`, "dd.MM.yyyy X", new Date());
  } else {
    return parse(`${day} +01`, "dd.MM.yyyy X", new Date());
  }
}
