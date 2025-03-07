"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = void 0;
const react_1 = __importStar(require("react"));
// Create the context
const AuthContext = (0, react_1.createContext)({
    user: null,
    login: async () => { },
    logout: () => { },
});
const AuthProvider = ({ children }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    // On app load, check if a token is saved and fetch user data
    (0, react_1.useEffect)(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            // Attempt to fetch user data with the token
            fetchUserProfile(savedToken);
        }
    }, []);
    // Fetch user profile from the backend using the stored token
    const fetchUserProfile = async (token) => {
        try {
            const res = await fetch('http://localhost:3000/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        }
        catch (err) {
            console.error(err);
            // If there's an error, remove token, set user to null
            localStorage.removeItem('token');
            setUser(null);
        }
    };
    // Called after a successful login
    const login = async (token) => {
        localStorage.setItem('token', token);
        await fetchUserProfile(token);
    };
    // Log out the user
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };
    return (<AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>);
};
exports.AuthProvider = AuthProvider;
// A helper hook to use the AuthContext in other components
const useAuth = () => (0, react_1.useContext)(AuthContext);
exports.useAuth = useAuth;
