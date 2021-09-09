import Router, { useRouter } from "next/router";
import Board from "layouts/dashboard";
import { useEffect, useRef, useState } from "react";
import { db } from "db/firebase";
import Product from "components/products";
import { useDB } from "provider/db";
import productscss from "@css/dashboard/products.module.css";
import Input from "components/inputs";
import Button from "components/buttons";
import Icon from "components/icons";
import { FileReaderByFormat } from "utils/files";
import { roundDown } from "utils/numbers";
import { toast } from "components/toasts";
import Chips from "components/chips";
import Select from "components/selects";
import Portal from "components/portals";
import firebase from "firebase/app";
import Head from "next/head";

export default function Path({ route }) {
  const router = useRouter();
  const inputFile = useRef(null);
  const { products, orders, routes } = useDB();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [toUpdate, setToUpdate] = useState();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState();

  const [categories, setCategories] = useState(routes);
  const [category, setCategory] = useState(null);

  const [file, setFile] = useState({ value: "", error: false });
  const [name, setName] = useState({ value: "", error: false });
  const [amount, setAmount] = useState({ value: "", error: false });
  const [fraction, setFraction] = useState({ value: "", error: false });
  const [path, setPath] = useState({ value: "", error: false });
  const [subpath, setSubpath] = useState({ value: "", error: false });
  const [sizes, setSizes] = useState({ value: "", error: false });

  //
  // Functions
  //

  const handleFileChange = (e) => {
    FileReaderByFormat(e.target, "images")
      .then(({ url, file }) => {
        setFile({ value: url, error: false });
      })
      .catch((error) => {
        setFile({ value: null, error: true });

        switch (error.code) {
          case "file-format-not-accepted":
            toast({
              value: "El tipo de archivo seleccionado no es válido",
              type: "error",
            });

            setTimeout(() => {
              toast({ value: "Solo aceptamos imágenes", type: "info" });
            }, 2000);
          default:
            console.warn(error.message);
        }
      });
  };

  const handleNameChange = (e) => {
    const { value } = e.target;

    if (value[0] === " ") return;
    setName({ value: value, error: !value?.length });
  };

  const handleAmountChange = (e) => {
    const { value } = e.target;
    let decPos = value?.indexOf(".");

    if (value[0] != "." && (value[0] == " " || isNaN(value))) return;
    if (value?.length == decPos + 1 && isNaN(value)) return;
    if (parseFloat(value) < parseFloat(fraction?.value)) {
      setFraction({ ...fraction, error: true });
      setAmount({
        value: value,
        error: true,
      });

      return;
    }

    setFraction({ ...fraction, error: false });
    setAmount({
      value: value,
      error: false,
    });
  };

  const handleFractionChange = (e) => {
    const { value } = e.target;
    let decPos = value?.indexOf(".");

    if (value[0] != "." && (value[0] == " " || isNaN(value))) return;
    if (value?.length == decPos + 1 && isNaN(value)) return;
    if (parseFloat(value) > parseFloat(amount?.value)) {
      setAmount({ ...amount, error: true });
      setFraction({
        value: value,
        error: true,
      });

      return;
    }

    setAmount({ ...amount, error: false });
    setFraction({
      value: value,
      error: false,
    });
  };

  const handleCategoryChange = (data) => {
    const { value } = data;

    let crr_category = categories?.filter((route) => route?.path === value);
    setCategory(crr_category.length > 0 ? crr_category[0] : []);
    setPath({ error: false, value: value });
    setSubpath({ error: false, value: "" });
    if (crr_category?.[0]?.sizesless) setSizes({ value: [], error: false });
  };

  const handleSubpathChange = (data) => {
    const { value } = data;

    setSubpath({
      error: false,
      value: value,
    });
  };

  const handleSizesChanged = (sizes) => {
    if (sizes.length == 0 && !category?.sizesless) {
      return setSizes({ value: [], error: true });
    }

    setSizes({ value: sizes, error: false });
  };

  const validateForm = () => {
    let errors = [];
    let amount_float = parseFloat(amount?.value);
    let fraction_float = parseFloat(fraction?.value);

    let hasFile = file?.value != "";
    let hasName = name?.value?.length > 0;
    let hasDuplicatedName = products?.filter((product) => {
      product?.name.toLowerCase() == name?.value?.toLocaleLowerCase();
    });
    let hasAmount = amount_float > 0;
    let hasFraction = fraction_float > 0;
    let hasCategory = path?.value;
    let hasSubcategory = subpath?.value;
    let hasSubcategories = category?.routes?.length > 0;
    let hasSizes = sizes?.value?.length > 0;

    if (!hasFile) {
      errors.push({
        key: "src",
        description: "Ud. olvidó incluir la fotografía del producto",
      });
    }

    if (!hasName) {
      errors.push({
        key: "name",
        description: "Recuerda incluir el nombre del producto",
      });
    }

    if (!hasDuplicatedName) {
      errors.push({
        key: "name",
        type: "warning",
        description: "Lo sentimos! El nombre del producto ya está en uso",
      });
    }

    if (!hasAmount) {
      errors.push({
        key: "amount",
        description: "Ups! Olvidó agregar el precio del producto",
      });
    }

    if (fraction_float > amount_float) {
      errors.push({
        key: "fraction",
        description: "¡Uy! Algo anda mal",
        explain: "Por favor, revise el precio final del producto",
      });
    }

    if (!hasCategory) {
      errors.push({
        key: "path",
        description: "Olvidó mostrar la categoría del producto",
      });
    }

    if (hasSubcategories && !hasSubcategory) {
      errors.push({
        key: "subpath",
        description: "¡Uy! Algo anda mal",
        explain: "Recuerda! Debe seleccionar la subcategoría del producto",
      });
    }

    if (!hasSizes && !category?.sizesless) {
      errors.push({
        key: "sizes",
        description: "Debe ingresar al menos una talla",
        explain: "Ingrese una talla y precione ENTER",
      });
    }

    errors?.forEach((error) => {
      let key = error?.key;

      if (key === "src") setFile({ ...file, error: true });
      if (key === "name") setName({ ...name, error: true });
      if (key === "amount") setAmount({ ...amount, error: true });
      if (key === "path") setPath({ ...path, error: true });
      if (key === "subpath") setSubpath({ ...subpath, error: true });
      if (key === "sizes") setSizes({ ...sizes, error: true });
      if (key === "fraction") {
        setAmount({ ...amount, error: true });
        setFraction({ ...fraction, error: true });
      }
    });

    // Check wheter there are more than one error
    if (errors.length >= 2) {
      setIsSaving(false);
      toast({
        type: "error",
        value: "!Ups! Debe completar todos los campos",
      });

      return {
        hasFraction,
        fraction_float,
        amount_float,
        fraction,
        error: true,
      };
    }

    // Check wheter there is one error
    if (errors.length === 1) {
      toast({
        type: "error",
        value: errors[0]?.description,
      });

      if (errors[0]?.explain) {
        setTimeout(() => {
          toast({
            type: "info",
            value: errors[0]?.explain,
          });

          setIsSaving(false);
        }, 2000);

        return {
          hasFraction,
          fraction_float,
          amount_float,
          fraction,
          error: true,
        };
      }

      setIsSaving(false);
      return {
        hasFraction,
        fraction_float,
        amount_float,
        fraction,
        error: true,
      };
    }

    return { hasFraction, fraction_float, amount_float, fraction };
  };

  const saveProduct = () => {
    setIsSaving(true);
    let response = validateForm();
    let { hasFraction, fraction_float, amount_float, fraction } = response;
    if (response?.error) return;

    let doc = {
      amount: parseFloat(roundDown(data?.amount, 2)),
      name: data?.name,
      path: data?.path,
      src: data?.src,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (hasFraction && fraction_float < amount_float) {
      doc.fraction = parseFloat(roundDown(fraction?.value, 2));
    }

    if (!category?.sizesless) {
      doc.sizes = data?.sizes;
    } else {
      doc.sizes = [];
    }

    db.collection("previews")
      .add({
        src: doc?.src,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then((docRef) => {
        delete doc?.src;

        db.collection("productos")
          .add({
            ...doc,
            src: docRef.id,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          })
          .then(() => {
            setIsSaving(false);
            toast({
              value: "La actualización del producto se realizó con éxito",
            });
            router.push("/productos");
          })
          .catch((error) => {
            toast({
              value:
                "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
              type: "error",
            });

            setIsSaving(false);
            console.error("Error updating document: ", error);
          });
      })
      .catch((error) => {
        toast({
          value:
            "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
          type: "error",
        });

        setIsSaving(false);
        console.error("Error updating document: ", error);
      });
  };

  const updateProduct = (key) => {
    let pin = route?.[1];

    if (key != "save") {
      let result = products?.filter((item) => item?.pin === pin)?.[0];

      let response = validateForm();
      let { hasFraction, fraction_float, amount_float, fraction } = response;
      if (response?.error) return;

      let doc = {
        amount: parseFloat(roundDown(data?.amount, 2)),
        name: data?.name,
        path: data?.path,
        src: data?.src,
      };

      if (hasFraction && fraction_float < amount_float) {
        doc.fraction = parseFloat(roundDown(fraction?.value, 2));
      }

      if (!category?.sizesless) {
        doc.sizes = data?.sizes;
      } else {
        doc.sizes = [];
      }

      let update = {};
      for (let key in doc) {
        if (key == "sizes") {
          if (
            JSON.stringify(doc?.sizes?.sort ? doc?.sizes?.sort() : []) !==
            JSON.stringify(result.sizes?.sort ? result?.sizes?.sort() : [])
          ) {
            update.sizes = doc.sizes;
          }
        } else {
          if (doc[key] !== result[key]) {
            update[key] = doc[key];
          }
        }
      }

      // Case nothing to update
      if (Object.keys(update).length == 0) return router.push("/productos");

      setToUpdate(update);
      return setIsAlertOpen(true);
    }

    let product = products?.filter((item) => item?.pin === pin)?.[0];
    let src_similarities = 0;
    orders.forEach((order) => {
      order?.cart?.forEach((item) => {
        if (item?.src && item?.src === product?.src) {
          src_similarities++;
        }
      });
    });

    if (toUpdate?.src) {
      if (src_similarities >= 1) {
        let new_doc = toUpdate;

        db.collection("previews")
          .add({
            src: new_doc?.src,
          })
          .then((docRef) => {
            delete new_doc?.src;

            db.collection("productos")
              .doc(pin)
              .update({
                ...new_doc,
                src: docRef.id,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              })
              .then(() => {
                setIsSaving(false);
                toast({
                  value: "La actualización del producto se realizó con éxito",
                });
                router.push("/productos");
              })
              .catch((error) => {
                toast({
                  value:
                    "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
                  type: "error",
                });

                setIsSaving(false);
                console.error("Error updating document: ", error);
              });
          })
          .catch((error) => {
            toast({
              value:
                "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
              type: "error",
            });

            setIsSaving(false);
            console.error("Error updating document: ", error);
          });
      } else {
        let new_doc = toUpdate;

        db.collection("previews")
          .doc(product?.srcid)
          .update({
            src: new_doc?.src,
          })
          .then(() => {
            delete new_doc?.src;

            db.collection("productos")
              .doc(pin)
              .update({
                ...new_doc,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              })
              .then(() => {
                setIsSaving(false);
                toast({
                  value: "La actualización del producto se realizó con éxito",
                });
                router.push("/productos");
              })
              .catch((error) => {
                toast({
                  value:
                    "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
                  type: "error",
                });

                setIsSaving(false);
                console.error("Error updating document: ", error);
              });
          })
          .catch((error) => {
            toast({
              value:
                "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
              type: "error",
            });

            setIsSaving(false);
            console.error("Error updating document: ", error);
          });
      }
    } else {
      db.collection("productos")
        .doc(pin)
        .update({
          ...toUpdate,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          setIsSaving(false);
          toast({
            value: "La actualización del producto se realizó con éxito",
          });
          router.push("/productos");
        })
        .catch((error) => {
          toast({
            value:
              "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
            type: "error",
          });

          setIsSaving(false);
          console.error("Error updating document: ", error);
        });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    if (route?.[0] === "nuevo") return setIsLoading(false);

    let pin = route?.[1];
    let product = products?.filter((item) => item?.pin === pin)?.[0];

    if (!product) return setTimeout(() => router.push("/productos"), 500);
    let category = categories?.filter(
      (route) => route?.path === `/${product?.path.split("/")?.[1]}`
    );

    setCategory(category?.[0]);
    setFile({ value: product?.src, error: false });
    setName({ value: product?.name, error: false });
    setAmount({ value: product?.amount, error: false });
    setFraction({ value: product?.fraction || "", error: false });
    setPath({ value: `/${product?.path?.split("/")?.[1]}`, error: false });
    setSubpath({ value: `/${product?.path?.split("/")?.[2]}`, error: false });
    setSizes({ value: product?.sizes, error: false });

    setTimeout(() => setIsLoading(false), 100);
  }, [route]);

  useEffect(() => {
    setCategories(routes?.filter((route) => !route?.private));
  }, [routes]);

  useEffect(() => {
    let state = {
      src: file,
      name,
      amount,
      fraction,
      path: {
        value: path?.value + subpath?.value,
      },
      sizes,
    };

    let updated = [];
    for (const key in state) {
      updated[key] = state[key]["value"];
    }

    setData(updated);
  }, [file, name, amount, fraction, path, subpath, sizes]);

  return (
    <>
      <Head>
        <title>
          {route?.[0] === "nuevo"
            ? "Nuevo producto | Giovis"
            : "Editar producto | Giovis"}
        </title>
      </Head>

      <Board>
        {isAlertOpen ? (
          <Portal>
            <div className="alert">
              <div className={productscss.update}>
                <header>
                  <h3>Actualizar producto</h3>
                  <button
                    disabled={isSaving}
                    onClick={() => setIsAlertOpen(false)}
                  >
                    <Icon name="close-square@broken" />
                  </button>
                </header>

                <article>
                  <Icon name="info-square@broken" />
                  <p>
                    Al realizar esta acción,
                    <span>
                      la información del producto se actualizará en toda la web.
                    </span>
                    Este cambio será notificado a todos los usuarios que quieran
                    adquirir el producto.
                    <span>
                      Esta actualización no afectará a los pedidos ya realizados
                    </span>
                  </p>
                </article>

                <span>¿Desea continuar con esta acción?</span>

                <footer>
                  <button
                    disabled={isSaving}
                    onClick={(e) => {
                      e?.preventDefault();
                      setIsAlertOpen(false);
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    disabled={isSaving}
                    onClick={(e) => {
                      e?.preventDefault();
                      updateProduct("save");
                    }}
                  >
                    Aceptar
                  </button>
                </footer>
              </div>
            </div>
          </Portal>
        ) : null}

        <div
          className={productscss.middle}
          style={isLoading ? { opacity: "0", userSelect: "none" } : null}
        >
          <div>
            <div className={productscss.form}>
              <input
                type="file"
                accept=".jpg, .jpeg, .png"
                ref={inputFile}
                onChange={(e) => handleFileChange(e)}
              />

              <Button
                role="upload"
                variant="ghost"
                color={file?.error ? "alizarin" : "concrete@10"}
                onClick={() => inputFile.current?.click()}
              >
                <Icon name="upload@bold" />
                Subir imagen
              </Button>

              <Input
                placeholder="Nombre del producto"
                onChange={(e) => handleNameChange(e)}
                state={name?.error ? "is-error" : null}
                value={name?.value}
              />

              <div role="amount">
                <Input
                  placeholder="Precio"
                  onChange={(e) => handleAmountChange(e)}
                  state={amount?.error ? "is-error" : null}
                  value={amount?.value}
                />

                <Input
                  placeholder="Precio final"
                  onChange={(e) => handleFractionChange(e)}
                  state={fraction?.error ? "is-error" : null}
                  value={fraction?.value}
                />
              </div>

              <Select
                role="categories"
                resizable={false}
                state={path?.error ? "is-error" : null}
                onChange={(data) => handleCategoryChange(data)}
                value={path?.value}
              >
                <option value="default">Elige una categoría</option>

                {categories?.map((route, index) => (
                  <option key={index} value={route?.path}>
                    {route.value}
                  </option>
                ))}
              </Select>

              {category?.routes?.length > 0 && (
                <Select
                  role="subcategories"
                  state={subpath?.error ? "is-error" : null}
                  onChange={(data) => handleSubpathChange(data)}
                  resizable={false}
                  value={subpath?.value}
                >
                  <option value="default">Elige una subcategoría</option>

                  {category?.routes?.map((route, index) => (
                    <option key={index} value={route?.path}>
                      {route.value}
                    </option>
                  ))}
                </Select>
              )}

              <Chips
                role="sizes"
                placeholder="Ingrese tallas"
                options={{
                  limit: 4,
                  length: {
                    max: 3,
                  },
                }}
                disabled={category?.sizesless ? true : false}
                value={sizes?.value || null}
                onChange={(chips) => handleSizesChanged(chips)}
                state={sizes?.error ? "is-error" : null}
              />

              <Button
                disabled={isSaving}
                role="save"
                onClick={() => {
                  if (route?.[0] === "editar") updateProduct();
                  else saveProduct();
                }}
              >
                {route?.[0] === "nuevo" ? "Guardar" : "Actualizar"}
              </Button>
              <Button
                disabled={isSaving}
                variant="ghost"
                size="small"
                to={isSaving ? null : "/productos"}
              >
                Cancelar
              </Button>
            </div>

            <Product data={{ ...data }} />
          </div>
        </div>
      </Board>
    </>
  );
}

Path.getInitialProps = async (context) => {
  const { query, res } = context;
  const { path } = query;

  const redirect = (route) => {
    if (res) {
      res.writeHead(307, { Location: route });
      res.end();
    } else {
      Router.redirect(route);
    }
  };

  // Case 404
  if (path?.length > 2 || (path?.[0] !== "nuevo" && path?.[0] !== "editar")) {
    redirect("/productos");
  }

  // Case new product
  if (path?.[0] === "nuevo" && path?.length > 1) {
    redirect("/productos/nuevo");
  }

  // Case update product
  if (path?.[0] == "editar" && path?.length == 1) {
    redirect("/productos");
  }

  return { route: path };
};
