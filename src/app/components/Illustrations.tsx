import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { c } from '../theme';

export function Ingredients({ size = 150 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 180 180" accessibilityElementsHidden>
    <Ellipse cx="90" cy="150" rx="64" ry="9" fill={c.deep} opacity={0.07} />
    <G rotation={-16} origin="52,85"><Rect x="35" y="35" width="34" height="91" rx="17" fill="#D6A65A" />
      <Path d="M43 54L56 48M43 74L56 68M43 94L56 88" stroke="#A37738" strokeWidth="3" strokeLinecap="round" /></G>
    <G rotation={14} origin="122,90"><Path d="M112 55Q107 34 120 21Q126 38 122 52Q134 28 144 36Q141 50 126 59" fill="#417B4D" />
      <Path d="M112 55Q122 43 133 57L123 131Q116 150 110 132Z" fill="#DD8C48" />
      <Path d="M114 72L124 69M113 89L121 87M113 107L119 105" stroke="#B56E3A" strokeWidth="2" strokeLinecap="round" /></G>
    <Path d="M38 96H145L135 143Q131 151 120 151H63Q52 151 48 141Z" fill={c.accent} />
    <Path d="M38 96H145" stroke={c.deep} strokeWidth="4" strokeLinecap="round" />
    <Path d="M60 110L65 137M83 110V139M105 110V139M128 110L122 137" stroke={c.deep} strokeWidth="2.5" opacity="0.25" strokeLinecap="round" />
    <Circle cx="87" cy="87" r="23" fill="#DE8064" /><Path d="M87 64L86 55M87 65L76 58M87 65L97 58" stroke="#386A40" strokeWidth="3" strokeLinecap="round" />
  </Svg>;
}

export function MealArt({ size = 96 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
    <Circle cx="60" cy="60" r="53" fill="#F5D987" /><Circle cx="60" cy="60" r="43" fill="#FFFDF4" /><Circle cx="60" cy="60" r="34" fill="#E6D3A2" />
    <Path d="M33 45Q43 29 53 43L49 57Q38 65 32 54M65 71Q76 59 86 71L82 86Q67 90 61 83" fill="#6A964F" />
    <Circle cx="72" cy="42" r="9" fill="#D58C70" /><Circle cx="47" cy="77" r="9" fill="#D58C70" />
    <Path d="M59 45L61 49M46 59L48 63M64 59L66 63M72 55L74 59M59 78L61 81M42 43L44 47M76 77L78 80M54 33L57 36M52 88L55 91" stroke="#FFF7E0" strokeWidth="4" strokeLinecap="round" />
  </Svg>;
}
