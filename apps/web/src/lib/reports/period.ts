import { REPORT_PERIOD, REPORT_TIME_ZONE, type ReportPeriod } from "./constants";

const LOCAL_DATE_PART = {
  YEAR: "year",
  MONTH: "month",
  DAY: "day",
  HOUR: "hour",
  MINUTE: "minute",
  SECOND: "second"
} as const;

type LocalDatePart = (typeof LOCAL_DATE_PART)[keyof typeof LOCAL_DATE_PART];

interface LocalCalendarDate {
  year: number;
  month: number;
  day: number;
}

interface LocalDateTime extends LocalCalendarDate {
  hour: number;
  minute: number;
  second: number;
}

export interface ReportPeriodBounds {
  start: Date | null;
  end: Date;
  startDate: string | null;
  endDate: string;
}

export interface LocalDayBounds {
  start: Date;
  end: Date;
  date: string;
}

const FORTALEZA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: REPORT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

function getLocalPart(date: Date, partType: LocalDatePart): number {
  const part = FORTALEZA_DATE_TIME_FORMATTER.formatToParts(date).find(
    (candidate) => candidate.type === partType
  );

  if (!part) {
    throw new RangeError(`Unable to resolve ${partType} in ${REPORT_TIME_ZONE}.`);
  }

  return Number(part.value);
}

function getFortalezaDateTime(date: Date): LocalDateTime {
  return {
    year: getLocalPart(date, LOCAL_DATE_PART.YEAR),
    month: getLocalPart(date, LOCAL_DATE_PART.MONTH),
    day: getLocalPart(date, LOCAL_DATE_PART.DAY),
    hour: getLocalPart(date, LOCAL_DATE_PART.HOUR),
    minute: getLocalPart(date, LOCAL_DATE_PART.MINUTE),
    second: getLocalPart(date, LOCAL_DATE_PART.SECOND)
  };
}

function getFortalezaDate(date: Date): LocalCalendarDate {
  const dateTime = getFortalezaDateTime(date);

  return {
    year: dateTime.year,
    month: dateTime.month,
    day: dateTime.day
  };
}

function formatSqlDate(date: LocalCalendarDate): string {
  return `${date.year.toString().padStart(4, "0")}-${date.month
    .toString()
    .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
}

function shiftLocalCalendarDate(date: LocalCalendarDate, days: number): LocalCalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  };
}

function getTimeZoneOffsetMilliseconds(date: Date): number {
  const dateTime = getFortalezaDateTime(date);
  const interpretedAsUtc = Date.UTC(
    dateTime.year,
    dateTime.month - 1,
    dateTime.day,
    dateTime.hour,
    dateTime.minute,
    dateTime.second
  );

  return interpretedAsUtc - date.getTime();
}

function getFortalezaMidnight(date: LocalCalendarDate): Date {
  const midnightAsUtc = Date.UTC(date.year, date.month - 1, date.day);
  const firstOffset = getTimeZoneOffsetMilliseconds(new Date(midnightAsUtc));
  const firstTimestamp = midnightAsUtc - firstOffset;
  const correctedOffset = getTimeZoneOffsetMilliseconds(new Date(firstTimestamp));

  return new Date(midnightAsUtc - correctedOffset);
}

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("The report period reference date must be valid.");
  }
}

export function isReportPeriod(value: unknown): value is ReportPeriod {
  return typeof value === "string" && Object.values(REPORT_PERIOD).some((period) => period === value);
}

/**
 * Returns null for invalid input so an API can return 400 instead of silently
 * applying a different interval.
 */
export function parseReportPeriod(value: unknown): ReportPeriod | null {
  return isReportPeriod(value) ? value : null;
}

/**
 * Page-only fallback. API callers should use parseReportPeriod so invalid input
 * remains distinguishable from a valid 30-day selection.
 */
export function getReportPeriodOrDefault(value: unknown): ReportPeriod {
  return parseReportPeriod(value) ?? REPORT_PERIOD.THIRTY_DAYS;
}

/**
 * Gives the current Fortaleza calendar day as an inclusive/exclusive timestamp
 * interval. It is intentionally independent of the VPS process timezone.
 */
export function getCurrentLocalDayBounds(now = new Date()): LocalDayBounds {
  assertValidDate(now);

  const currentDate = getFortalezaDate(now);
  const nextDate = shiftLocalCalendarDate(currentDate, 1);

  return {
    start: getFortalezaMidnight(currentDate),
    end: getFortalezaMidnight(nextDate),
    date: formatSqlDate(currentDate)
  };
}

/**
 * Resolves timestamp bounds as [start, end): start is inclusive and `end` is
 * exclusive. `startDate` and `endDate` are Fortaleza calendar dates for SQL
 * `date` columns; use the end date inclusively because a SQL `date` has no
 * time-of-day and must include the current local date.
 */
export function resolveReportPeriod(period: ReportPeriod, now = new Date()): ReportPeriodBounds {
  assertValidDate(now);

  const currentDate = getFortalezaDate(now);
  const endDate = formatSqlDate(currentDate);

  if (period === REPORT_PERIOD.ALL) {
    return { start: null, end: now, startDate: null, endDate };
  }

  if (period === REPORT_PERIOD.YEAR) {
    const yearStart = { year: currentDate.year, month: 1, day: 1 };

    return {
      start: getFortalezaMidnight(yearStart),
      end: now,
      startDate: formatSqlDate(yearStart),
      endDate
    };
  }

  const daysBefore = period === REPORT_PERIOD.THIRTY_DAYS ? 29 : 89;
  const startDate = shiftLocalCalendarDate(currentDate, -daysBefore);

  return {
    start: getFortalezaMidnight(startDate),
    end: now,
    startDate: formatSqlDate(startDate),
    endDate
  };
}
