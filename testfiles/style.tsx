// Test file for a tsx file embedding css variables for color token.

/**
 * Sample function returning an object representing styles for React components to consume. 
 */
function getJSXStyleAsObject() {
	return {
		"color": "var(--colorA)",
		"background-color": "var(--colorB)"
	};
}
