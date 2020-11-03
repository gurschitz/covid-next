import { atom } from "jotai";

export type WidgetInterval = 14 | 30 | 60;

export const widgetIntervalAtom = atom<WidgetInterval>(14);

export type ChartsInterval = null | 30 | 60 | 90;

export const chartsIntervalAtom = atom<ChartsInterval>(90);
