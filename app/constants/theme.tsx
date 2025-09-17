import { Dimensions } from "react-native";
const {width,height} = Dimensions.get('screen');

export const COLORS = {
	primary: "#59ba50",
	primaryLight: "#E5F5F0",
	secondary: "#F6DBB3",
	success: "#159E42",
	danger: "#FF3131",
	warning: "#ffb02c",
	dark: "#2f2f2f",
	light: "#E6E6E6",
	info: "#2B39B9",
	white: "#fff",
	label: "#8A8A8A",
	backgroundColor: "#ffffff",
	black: "#000",
	blackLight2: "#7D7F99",
	blackLight: "#B0B5B9",
	placeholder:"#D9D9D9",
	inputBackground:"#868D94",
	
	//light theme
	card : '#F6F6F6',
	background : "#FFFFFF",
	text : "#8391A1",
	title : "#222222",
	borderColor : "#ECECEC",
	input : "#F7F8F9",
	inputBorder:"#E8ECF4",
	
	//dark theme
	darkCard : "rgba(255,255,255,.05)",
	darkBackground : "#2F2F2F",
	darkText : "rgba(255,255,255,.6)",
	darkTitle : "#fff",
	darkBorder : "rgba(255,255,255,.2)",
	darkInput : "rgba(255,255,255,.05)",
	darkinputborder:"#C1CDD9",
}

export const SIZES = {
	fontLg: 16,
	font: 14,
	fontSm: 13,
	fontXs: 12,

	//radius
	radius_sm: 8,
	radius: 6,
	radius_lg: 15,

	//space
	padding: 15,
	margin: 15,

	//Font Sizes
	h1: 40,
	h2: 28,
	h3: 24,
	h4: 20,
	h5: 18,
	h6: 16,

	//App dimensions
	width,
	height,

	container: 800,
};



const appTheme = {COLORS, SIZES }

export default appTheme;