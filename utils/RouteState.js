class RouteState {
    constructor() {
        this.route = null;
        this.currentIndex = 0;
        this.macroName = null;
        this.isActive = false;
    }

    setRoute(route, macroName) {
        this.route = route;
        this.macroName = macroName;
        this.currentIndex = 0;
        this.isActive = route && route.length > 0;
    }

    clearRoute() {
        this.route = null;
        this.currentIndex = 0;
        this.macroName = null;
        this.isActive = false;
    }
}

const routeState = new RouteState();

export { routeState };
export default routeState;
