// ═══════════════════════════════════════════════
// CHEF LOGIN ANIMATION
// ═══════════════════════════════════════════════

const Chef = {

    base: null,
    eyes: null,
    email: null,
    password: null,

    openEyes: "img/chef/ojos-abiertos.png",
    closedEyes: "img/chef/ojos-cerrados.png",

    blinkTimer: null,

    init(){

        this.base = document.getElementById("chef");
        this.eyes = document.getElementById("chef-eyes");

        this.email = document.getElementById("login-email");
        this.password = document.getElementById("login-pass");

        if(!this.base || !this.eyes) return;

        this.bindEvents();
        this.startBlink();

    },

    bindEvents(){

        // Email
        this.email?.addEventListener("focus", () => {
            this.showEyes();
        });

        // Contraseña
        this.password?.addEventListener("focus", () => {
            this.closeEyes();
        });

        this.password?.addEventListener("blur", () => {
            this.showEyes();
        });

    },

    // --------------------
    // Ojos abiertos
    // --------------------

    showEyes(){

        this.eyes.src = this.openEyes;
        this.eyes.classList.remove("closed");

    },

    // --------------------
    // Ojos cerrados
    // --------------------

    closeEyes(){

        this.eyes.src = this.closedEyes;
        this.eyes.classList.add("closed");

    },

    // --------------------
    // Parpadeo
    // --------------------

    blink(){

        if(document.activeElement === this.password) return;

        this.closeEyes();

        setTimeout(() => {

            this.showEyes();

        }, 80);

    },

    startBlink(){

        this.blinkTimer = setInterval(() => {

            this.blink();

        }, 3000);

    },

    // --------------------
    // Login correcto
    // --------------------

    success(){

        this.base.classList.add("chef-success");

        setTimeout(() => {

            this.base.classList.remove("chef-success");

        }, 700);

    },

    // --------------------
    // Login incorrecto
    // --------------------

    error(){

        this.base.classList.add("chef-error");

        setTimeout(() => {

            this.base.classList.remove("chef-error");

        }, 600);

    }

};

document.addEventListener("DOMContentLoaded", () => {

    Chef.init();

});