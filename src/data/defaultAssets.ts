import { type Asset, generateAsset } from "../lib";
import { liquid } from "./liquid";
import { mid } from "./mid";
import { nasdaq } from "./nasdaq";
import { next50 } from "./next50";
import { nifty } from "./nifty";
import { small } from "./small";

export const defaultAssets: Asset[] = [
  generateAsset("Nifty 50", 0.25, nifty),
  generateAsset("Nifty Next 50", 0.2, next50),
  generateAsset("Invesco Mid Cap", 0.2, mid),
  generateAsset("Axis Small Cap", 0.15, small),
  generateAsset("Nasdaq 100", 0.15, nasdaq),
  generateAsset("Parag Parikh Liquid Fund", 0.05, liquid),
];
