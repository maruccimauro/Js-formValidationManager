class formValidationManager {
    errorList = {};
    HTMLMessageContainer;
    HTMLMessageTemplate;
    statusControlFunction = {
        errorOnSubmit: () => {},
        successOnSubmit: () => {},
    };

    errorMode = 0;
    hasErrorInCurrentValidation = false;

    form;
    constrains = [];
    currentConstrain;

    standardErrorModels = {
        defaultError: 0,
        singleError: 1,
        multiError: 2,
        singleErrorPerField: 3,
    };
    standardRegExpModels = {
        numeric: {
            numeric: {
                regExp: /^\d$/,
                standardMsg: "El campo %value% solo acepta numeros",
            },
            numericWithSpaces: {
                regExp: /^\d\s?$/,
                standardMsg:
                    "El campo %value% solo acepta numeros y espacios en blanco",
            },
            numericPhone: {
                regExp: /^(((\+\d+\s?\-?)|(\({1}\d+\){1})|(\d+)?)((\({1}\d+\){1})|(\d+)?\s?\-?)\s?\-?)?(\d+\s?\-?)+$/,
                standardMsg:
                    "El campo %value% solo acepta numeros de telefono con separadores como espacio y guion , y agrupadores de parentesis o asignadores de pais como +.",
            },
        },
        words: {
            singleWord: {
                regExp: /^[a-zA-Z]*$/,
                standardMsg:
                    "El campo %value%  ha detectado caracteres no permitidos",
            },
            multipleWords: {
                regExp: /^([a-zA-Z]+\s*)*$/,
                standardMsg:
                    "El campo %value% ha detectado caracteres no permitidos",
            },
            sentence: {
                regExp: /^[A-Za-z0-9.,!?¿¡:;'\s-]*$/,
                standardMsg:
                    "El campo %value% ha detectado caracteres no permitidos",
            },
            paragraph: {
                regExp: /^[A-Za-z0-9.,!?¿¡:;'\s-]*\n?$/,
                standardMsg:
                    "El campo %value% ha detectado caracteres no permitidos",
            },
        },
        password: {
            medium: {
                regExp: /(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
                min: 8,
                standardMsg:
                    "El campo %value% debe contener caracteres normales incluyendo una letra mayuscula y un numero",
            },
            strong: {
                regExp: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]$/,
                min: 10,
                standardMsg:
                    "El campo %value% debe contener caracteres incluyendo al menos una letra minúscula, una letra mayuscula, un numero y un carácter especial como @$!%*?&.",
            },
        },
        misselaneus: {
            email: {
                regExp: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                standardMsg:
                    "El campo %value% solo acepta valores de tipo email.",
            },
        },
    };
    sendErrorApp(msg) {
        console.error(`formManagement say: ${msg}`);
    }

    constructor(form) {
        this.form =
            document.forms[form] ||
            (!Boolean(form)
                ? document.forms[0]
                : this.sendErrorApp("Error al interceptar el fomulario."));

        this.form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.runFormValidation();
        });
    }

    getAbstractionForm() {
        return this.form;
    }

    newConstrain(constrain) {
        this.constrains.push(constrain);
    }

    interceptField(field) {
        return (
            this.form[field] ||
            this.sendErrorApp(`Error al interceptar el campo ${field}`)
        );
    }

    runFormValidation() {
        this.resolveResetFormValidation();

        this.constrains.forEach((constrain) => {
            this.runConstrainValidation(constrain);
        });

        if (Object.keys(this.errorList).length > 0) {
            this.showErrors();
            this.statusControlFunction.errorOnSubmit();
        } else {
            this.statusControlFunction.successOnSubmit();
            this.form.reset();
        }
    }

    resolveResetFormValidation() {
        this.hasErrorInCurrentValidation = false;
        this.errorList = {};
    }

    addErrorConstrain(message) {
        if (this.currentConstrain.field in this.errorList) {
            this.errorList[this.currentConstrain.field].push(message);
        } else {
            this.errorList[this.currentConstrain.field] = [message];
        }
        console.log(this.hasErrorInCurrentValidation);
        this.hasErrorInCurrentValidation = true;
        console.log(this.errorList[this.currentConstrain.field]);
    }

    resolveEvaluationConstrain(statusCondition, message) {
        if (
            this.hasErrorInCurrentValidation &&
            (this.errorMode === this.standardErrorModels.defaultError ||
                this.errorMode === this.standardErrorModels.singleError)
        ) {
            return false;
        } else {
            !statusCondition || this.addErrorConstrain(message);
            return !statusCondition;
        }
    }

    resolvePrepareStandardMessage(template) {
        return template.replace("%value%", this.currentConstrain.tagName);
    }

    runConstrainValidation(constrain) {
        this.currentConstrain = constrain;
        let field = this.form[this.currentConstrain.field];
        let value = String(field.value);

        let { required, min, max, model, tagName, matchField, matchTagName } =
            constrain;
        required ??= false;
        let resolve = this.resolveEvaluationConstrain.bind(this);

        if (required) {
            model ??= {};
            matchField ??= false;
            matchTagName ??= "Not Assigned";
            min = Math.max(model.min ?? 0, min ?? 0);
            max ??= Infinity;
            matchField ??= false;
            tagName ??= "Not Assigned";

            let notEmpty = resolve(
                value === "",
                `El campo ${tagName} no puede estar vacio.`
            );
            if (notEmpty) {
                resolve(
                    value.length < min,
                    `El campo ${tagName} debe tener un minimo de ${min} caracteres.`
                );
                resolve(
                    value.length > max,
                    `El campo ${tagName} debe tener un maximo de ${max} caracteres.`
                );

                if (model.regExp?.test) {
                    resolve(
                        !model.regExp.test(value) ?? true,
                        this.resolvePrepareStandardMessage(model.standardMsg)
                    );
                }

                if (matchField in this.form) {
                    resolve(
                        value !== String(this.form[matchField].value),
                        `El campo ${tagName} y el campo ${matchTagName} deben ser iguales.`
                    );
                }
            }
        }
    }

    setErrorMode(mode) {
        this.errorMode = mode;
    }

    getErrors() {
        return Object.values(this.errorList).flat();
    }

    showErrors() {
        let errors = this.getErrors();
        let temporalContainer = "";
        if (errors.length) {
            if (!this.HTMLMessageContainer) {
                errors.forEach((message) => {
                    temporalContainer += message + "\n";
                });
                alert(temporalContainer);
            } else {
                if (!this.HTMLMessageTemplate) {
                    this.sendErrorApp("HTMLMessageTemplate no esta definido.");
                } else {
                    errors.forEach((message) => {
                        temporalContainer +=
                            this.HTMLMessageTemplate.replace(
                                "%value%",
                                message
                            ) + "\n";
                    });
                }

                this.HTMLMessageContainer.innerHTML = temporalContainer;
            }
        }
    }

    setHTMLMessageContainer(htmlElementId) {
        this.HTMLMessageContainer = document.getElementById(htmlElementId);
    }

    setHTMLMessageTemplate(htmlTemplate) {
        this.HTMLMessageTemplate = htmlTemplate;
    }
}
document.getElementById("message_container").addEventListener("click", () => {
    document.getElementById("modal").classList.add("ocultar");
});

let form = new formValidationManager();
form.setErrorMode(form.standardErrorModels.multiError);
form.setHTMLMessageContainer("list_message");
form.setHTMLMessageTemplate("<li>%value%</li>");

form.statusControlFunction.errorOnSubmit = function () {
    document.getElementById("modal").classList.remove("ocultar");
};

document.getElementById("message_container2").addEventListener("click", () => {
    document.getElementById("modal2").classList.add("ocultar");
});

form.statusControlFunction.successOnSubmit = function () {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                document.getElementById("greeting").innerHTML =
                    request.responseText;
                document.getElementById("modal2").classList.remove("ocultar");
            } else {
                console.error("Hubo un error al cargar el archivo.");
            }
        }
    };

    request.open("GET", "./saludos.txt", true);
    request.send();
};

form.newConstrain({
    field: "firstName",
    tagName: "Nombre",
    min: 3,
    max: 25,
    required: true,
    model: form.standardRegExpModels.words.multipleWords,
});
form.newConstrain({
    field: "lastName",
    tagName: "Apellido",
    min: 3,
    max: 25,
    required: true,
    model: form.standardRegExpModels.words.multipleWords,
});
form.newConstrain({
    field: "phone",
    tagName: "Telefono",
    min: 3,
    max: 25,
    required: true,
    model: form.standardRegExpModels.numeric.numericPhone,
});

form.newConstrain({
    field: "email",
    tagName: "Email",
    matchField: "email_confirm",
    matchTagName: "confirmacion de Email",
    min: 3,
    max: 50,
    required: true,
    model: form.standardRegExpModels.misselaneus.email,
});
form.newConstrain({
    field: "contact",
    tagName: "Motivo de contacto",
    required: true,
});

form.newConstrain({
    field: "subject",
    tagName: "Asunto",
    min: 3,
    max: 50,
    required: true,
    model: form.standardRegExpModels.words.sentence,
});

form.newConstrain({
    field: "description",
    tagName: "Descripcion",
    min: 20,
    max: 500,
    required: true,
    model: form.standardRegExpModels.words.paragraph,
});
