import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Context'i oluştur
const ThemeContext = createContext();

// 2. Provider Component'ini oluştur
export const ThemeProvider = ({ children }) => {
    // Tarayıcının veya localStorage'ın tercihini al
    const getInitialTheme = () => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                return savedTheme;
            }
            // Tarayıcının kendi renk şeması tercihini kontrol et
            const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
            if (userMedia.matches) {
                return 'dark';
            }
        }
        return 'light'; // Varsayılan
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        // Tema değiştiğinde <html> elementine attribute ekle/kaldır
        const root = window.document.documentElement;
        
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);

        // Tercihi localStorage'a kaydet
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// 3. Kolay kullanım için özel bir hook oluştur
export const useTheme = () => {
    return useContext(ThemeContext);
};
