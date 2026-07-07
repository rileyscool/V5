class Executor {
    constructor() {
        this.tickCallbacks = [];
        this.stepCallbacks = [];

        this.tickRegister = null;
        this.stepRegister = null;
    }

    execute() {
        this.destroy();

        this.tickRegister = register('tick', () => this.runCallbacks(this.tickCallbacks, 'tick'));
        this.stepRegister = register('step', () => this.runCallbacks(this.stepCallbacks, 'step')).setFps(120);
    }

    runCallbacks(callbacks, name) {
        for (const callback of callbacks) {
            if (typeof callback !== 'function') continue;
            try {
                callback();
            } catch (e) {
                console.error(`PathExecutor ${name} callback error:`, e);
            }
        }
    }

    destroy() {
        if (this.tickRegister) this.tickRegister.unregister();
        if (this.stepRegister) this.stepRegister.unregister();
        this.tickRegister = null;
        this.stepRegister = null;
    }

    onTick(callback) {
        if (typeof callback === 'function') {
            this.tickCallbacks.push(callback);
        }
    }

    onStep(callback) {
        if (typeof callback === 'function') {
            this.stepCallbacks.push(callback);
        }
    }
}

export const PathExecutor = new Executor();
