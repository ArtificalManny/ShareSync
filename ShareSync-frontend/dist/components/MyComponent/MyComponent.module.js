import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './MyComponent.module.css';
const MyComponent = () => (_jsxs("div", { className: styles.myClass, children: [_jsx("h2", { children: "Welcome to MyComponent" }), _jsx("p", { children: "This is styled by MyComponent.module.css" })] }));
export default MyComponent;
