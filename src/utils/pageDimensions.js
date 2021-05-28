function getWidth() {
    // eslint-disable-next-line no-restricted-globals
    if (self.innerWidth) {
        // eslint-disable-next-line no-restricted-globals
        return self.innerWidth;
    }

    if (document.documentElement && document.documentElement.clientWidth) {
        return document.documentElement.clientWidth;
    }

    if (document.body) {
        return document.body.clientWidth;
    }
}

function getHeight() {
    // eslint-disable-next-line no-restricted-globals
    if (self.innerHeight) {
        // eslint-disable-next-line no-restricted-globals
        return self.innerHeight;
    }

    if (document.documentElement && document.documentElement.clientHeight) {
        return document.documentElement.clientHeight;
    }

    if (document.body) {
        return document.body.clientHeight;
    }
}

export {
    getWidth,
    getHeight
}