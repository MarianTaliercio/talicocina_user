// ======================================================
// PASSWORD.JS
// Recuperación de contraseña
// ======================================================

window.forgotPassword = function () {

    // Si ya existe el modal, solo lo vuelve a mostrar
    const existente = document.getElementById("forgot-modal");

    if (existente) {
        existente.style.display = "flex";
        document.getElementById("forgot-email").focus();
        return;
    }

    const modal = document.createElement("div");
    modal.id = "forgot-modal";

    modal.innerHTML = `
        <div class="forgot-box">

            <h2>¿Olvidaste tu contraseña?</h2>

            <p>
                Ingresá el correo con el que te registraste.
            </p>

            <input
                type="email"
                id="forgot-email"
                placeholder="Correo electrónico">

            <div class="forgot-buttons">
                <button class="btn btn-primary btn-full" id="cancel-forgot">Cancelar</button>
                <button class="btn btn-primary btn-full" id="send-forgot">Enviar correo</button>
            </div>

        </div>
    `;

    Object.assign(modal.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "99999"
    });

    document.body.appendChild(modal);

    const box = modal.querySelector(".forgot-box");

    Object.assign(box.style, {
        background: "#fff",
        width: "400px",
        maxWidth: "90%",
        padding: "25px",
        borderRadius: "15px",
        boxShadow: "0 15px 40px rgba(0,0,0,.25)"
    });

    box.querySelector("h2").style.marginTop = "0";

    const input = document.getElementById("forgot-email");

    Object.assign(input.style, {
        width: "100%",
        padding: "12px",
        margin: "15px 0",
        borderRadius: "8px",
        border: "1px solid #ccc",
        boxSizing: "border-box"
    });

    const botones = box.querySelector(".forgot-buttons");

    Object.assign(botones.style, {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px"
    });

    document
        .getElementById("cancel-forgot")
        .addEventListener("click", closeForgotModal);

    document
        .getElementById("send-forgot")
        .addEventListener("click", sendRecoveryEmail);

    input.focus();
};

window.closeForgotModal = function () {

    const modal = document.getElementById("forgot-modal");

    if (modal) {
        modal.remove();
    }
};

window.sendRecoveryEmail = async function () {

    const input = document.getElementById("forgot-email");
    const email = input.value.trim();

    if (!email) {
        toast("Ingresá un correo electrónico.");
        input.focus();
        return;
    }

    const btn = document.getElementById("send-forgot");

    btn.disabled = true;
    btn.textContent = "Verificando...";

    const { data: user, error } = await window.db
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    btn.disabled = false;
    btn.textContent = "Enviar correo";

    if (error) {
        toast("Ocurrió un error.");
        return;
    }

    if (!user) {
        toast("No existe una cuenta con ese correo.");
        return;
    }

    closeForgotModal();

    alert(
        "✅ Se envió un correo de recuperación.\n\n" +
        "Revisá tu bandeja de entrada."
    );

    // Acá después agregaremos el envío real del email.
};