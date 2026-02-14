import * as RF from "@xyflow/react";
import React from "react";

// Helper function to find the scrollable parent
const findScrollableParent = (element: HTMLElement | null): HTMLElement => {
    if (!element || element === document.body) {
        return document.documentElement || document.body;
    }

    const { overflow, overflowY } = window.getComputedStyle(element);
    const isScrollable = /(auto|scroll)/.test(overflow + overflowY);

    if (isScrollable && element.scrollHeight > element.clientHeight) {
        return element;
    }

    return findScrollableParent(element.parentElement);
};

const CustomReactFlow = (props: any) => {
    return (
        <RF.ReactFlow
            {...props}
            zoomOnScroll={false}
            panOnScroll={false}
            onWheel={(event: React.WheelEvent) => {
                // Prevent ReactFlow from handling the wheel event usually
                // But here we want to allow page scroll when over the flow
                // The original logic was to manually scroll the parent

                // Prevent default if we were to zoom, but here we disabled zoomOnScroll
                // So we might just want to let it bubble if we want page scroll

                // The original code manually scrolled the container:
                // event.preventDefault();
                // event.stopPropagation();

                // Find the scrollable parent container
                const scrollContainer = findScrollableParent(event.currentTarget.parentElement);

                if (scrollContainer) {
                    // Manually scroll the container based on the wheel delta
                    scrollContainer.scrollTop += event.deltaY;
                }

                // Call the original onWheel handler if it exists
                if (props.onWheel) {
                    props.onWheel(event);
                }
            }}
        />
    );
};

export default CustomReactFlow;
