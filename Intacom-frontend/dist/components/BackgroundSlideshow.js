import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './BackgroundSlideshow.css';
const BackgroundSlideshow = () => {
    const features = [
        {
            image: 'https://images.unsplash.com/photo-1516321318423-4b31e0b0f38f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
            text: 'Collaborate on Projects',
        },
        {
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
            text: 'Build Professional Networks',
        },
        {
            image: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
            text: 'Engage Socially',
        },
    ];
    return (_jsx("div", { className: "background-slideshow", children: _jsxs("div", { className: "slides-container", children: [features.map((feature, index) => (_jsx("div", { className: "slide", style: { backgroundImage: `url(${feature.image})` }, children: _jsx("div", { className: "slide-text", children: feature.text }) }, index))), features.map((feature, index) => (_jsx("div", { className: "slide", style: { backgroundImage: `url(${feature.image})` }, children: _jsx("div", { className: "slide-text", children: feature.text }) }, `duplicate-${index}`)))] }) }));
};
export default BackgroundSlideshow;
