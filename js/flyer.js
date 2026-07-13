// ═══════════════════════════════════════════════
// FLYER
// ═══════════════════════════════════════════════

const Flyer = {

    open(day){

        const comidas = {};

        MEALS.forEach(meal => {

            const key = `${day}|${meal}`;

            if(plan[key]){

                const receta = recipes.find(r => r.id === plan[key]);

                if(receta){
                    comidas[meal] = receta;
                }

            }

        });

        this.render(day, comidas);

    },

   

    download(){

            const flyer = document.querySelector(".flyer");

            html2canvas(flyer,{
                scale:3,
                useCORS:true,
                backgroundColor:null
            }).then(canvas=>{

                const link=document.createElement("a");

                link.download="TALI-"+Date.now()+".png";

                link.href=canvas.toDataURL("image/png");

                link.click();

            });

    },

    share(){

        const flyer=document.querySelector(".flyer");

        html2canvas(flyer,{
            scale:3,
            useCORS:true
        }).then(async canvas=>{

            canvas.toBlob(async blob=>{

                const file=new File(
                    [blob],
                    "tali.png",
                    {type:"image/png"}
                );

                if(navigator.canShare &&
                navigator.canShare({files:[file]})){

                    await navigator.share({

                        title:"Mi menú",

                        text:"Planificado con TALI COCINA",

                        files:[file]

                    });

                }else{

                    alert("Tu navegador no soporta compartir archivos.");

                }

            });

        });

    },
    render(day, comidas){

        const card = (tipo, emoji, r)=>{

            if(!r) return "";

            const img = r.ytId
                ? `https://img.youtube.com/vi/${r.ytId}/hqdefault.jpg`
                : "";

            return `

                <div class="flyer-meal">

                    ${
                        img
                        ? `<img class="flyer-img" src="${img}">`
                        : ""
                    }

                    <div class="flyer-content">

                        <div class="flyer-type">
                            ${emoji} ${tipo}
                        </div>

                        <div class="flyer-name">
                            ${r.name}
                        </div>

                        <div class="flyer-info">

                            ${
                                r.cals
                                ? `<span>🔥 ${r.cals} kcal</span>`
                                : ""
                            }

                            ${
                                r.porciones
                                ? `<span>👥 ${r.porciones}</span>`
                                : ""
                            }

                        </div>

                    </div>

                </div>

            `;

        };

        document.getElementById("flyer-preview").innerHTML = `

            <div class="flyer">
                <div class="flyer-header">

                    <div class="flyer-logo">

                        🍴 TALI COCINA

                    </div>

                    <div class="flyer-day">

                        ${day}

                    </div>

                </div>

                ${card("Almuerzo","🍽",comidas["Almuerzo"])}

                ${card("Cena","🌙",comidas["Cena"])}

                <div class="flyer-footer">

                    ❤️ Planificado con TALI COCINA

                </div>

            </div>

        `;

        openMo("mo-flyer");

    }

};