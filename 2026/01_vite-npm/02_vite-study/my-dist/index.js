import { useState as e } from "react";
import { jsxs as t } from "react/jsx-runtime";
// src/components/MyButton.tsx
function n(n) {
	let [r, i] = e(0);
	return /* @__PURE__ */ t("button", {
		onClick: () => i(r + 1),
		children: [
			n.title,
			"：",
			r
		]
	});
}
export { n as MyButton };

//# sourceMappingURL=index.js.map