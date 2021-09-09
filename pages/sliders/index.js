import Board from "layouts/dashboard";
import Slider from "components/slider";
import herocss from "@css/dashboard/slider.module.css";
import Button from "components/buttons";
import Icon from "components/icons";
import { useRef, useState, useEffect } from "react";
import { FileReaderByFormat } from "utils/files";
import { db, storage } from "db/firebase";
import Spinner from "components/spinners";
import { toast } from "components/toasts";
import Head from "next/head";

const Options = ({ slide, update, remove }) => {
  const input = useRef(null);

  return (
    <div type="actions">
      <input
        type="file"
        accept=".jpg, .jpeg, .png"
        ref={input}
        onChange={(e) => update(e, slide.id)}
      />
      <Button onClick={() => input.current?.click()}>Actualizar poster</Button>

      <Button color="alizarin" onClick={() => remove(slide.id)}>
        Eliminar slide
      </Button>
    </div>
  );
};

const HeroSlide = ({ slide, update, removeSlide }) => {
  return (
    <>
      <img src={slide?.url} alt="slide" />
      <Options slide={slide} update={update} remove={removeSlide} />
    </>
  );
};

const HeroSlider = ({ data, removeSlide, updateSlide }) => {
  const [slides, setSlides] = useState([]);

  const update = (e, id) => {
    FileReaderByFormat(e.target, "images")
      .then(({ url, file }) => {
        updateSlide(id, {
          id: id,
          type: `${file.type?.split("/")[1]}`,
          url: url,
        });
      })
      .catch((error) => {
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

  useEffect(() => {
    setSlides(data.filter((slides) => slides.deleted != true));
  }, [data]);

  return (
    <Slider options={{ autoplay: false }}>
      {slides?.length > 0
        ? slides?.map((slide) => (
            <HeroSlide
              key={slide.id}
              slide={slide}
              update={update}
              removeSlide={removeSlide}
            />
          ))
        : ""}
    </Slider>
  );
};

export default function HomeSlider() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSlides, setShowSlides] = useState(false);

  const [backup, setBackup] = useState([]);
  const [slides, setSlides] = useState([]);

  const [needsToBeSaved, setNeedsToBeSaved] = useState();
  const input_new = useRef(null);

  const newSlide = (e) => {
    FileReaderByFormat(e.target, "images")
      .then(({ file, url }) => {
        setSlides([
          ...slides,
          {
            id: `${Date.now()}`,
            type: `${file.type?.split("/")[1]}`,
            saved: false,
            url: url,
          },
        ]);
      })
      .catch((error) => {
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

  const removeSlide = (id) => {
    setSlides(
      slides.map((slide) =>
        slide.id == id ? { ...slide, deleted: true } : slide
      )
    );
  };

  const updateSlide = (id, updatedFile) => {
    setSlides(slides.map((slide) => (slide.id === id ? updatedFile : slide)));
  };

  const saveChanges = () => {
    setIsLoading(true);

    const deleted = slides.filter((slide) => slide.deleted === true);
    const deletedOnDB = deleted.filter((slide) => slide.doc);
    const available = slides.filter((slide) => !slide.deleted);
    const unsaved = available.filter((slide) => slide.saved === false);

    // Remove image from storage
    deletedOnDB.forEach((slide) => {
      storage
        .ref()
        .child(`images/slides/${slide.id}.${slide.type}`)
        .delete()
        .then(() => {
          // Remove data from db
          db.collection("slides")
            .doc(slide.doc)
            .delete()
            .catch((error) => console.log(error));
        })
        .catch((error) => console.log(error));
    });

    // Add image to storage
    unsaved.forEach((slide) => {
      storage
        .ref()
        .child(`images/slides/${slide.id}.${slide.type}`)
        .putString(slide.url, "data_url")
        .then((snapshot) => {
          snapshot.ref
            .getDownloadURL()
            .then((downloadURL) => {
              slide.url = downloadURL;
              delete slide?.saved;
              delete slide?.file;

              // Add data to db
              db.collection("slides")
                .doc()
                .set(slide)
                .catch((error) => console.log(error));
            })
            .catch((error) => console.log(error));
        });
    });

    if (!unsaved && !deletedOnDB) setIsLoading(false);
  };

  useEffect(() => {
    const existChanges = JSON.stringify(slides) != JSON.stringify(backup);
    if (existChanges) setNeedsToBeSaved(true);
    else setNeedsToBeSaved(false);
  }, [slides]);

  useEffect(() => {
    const onSnapshot = db.collection("slides").onSnapshot((snapshot) => {
      setIsLoading(true);
      setShowSlides(false);

      const available = slides.filter((slide) => !slide.deleted);
      const saved = available.filter((slide) => slide.saved !== false);
      let docs = [];

      snapshot.forEach((doc) => docs.push({ ...doc.data(), doc: doc.id }));
      setBackup([...saved, ...docs]);
      setSlides([...saved, ...docs]);

      setIsLoading(false);
      setTimeout(() => setShowSlides(true), 4000);
    });

    return onSnapshot;
  }, []);

  return (
    <>
      <Head>
        <title>Sliders | Giovis</title>
      </Head>

      <Board>
        <div className={herocss.content}>
          {isLoading ? (
            <Spinner />
          ) : (
            <>
              {!showSlides ? <Spinner /> : null}

              <div
                className={herocss.main}
                style={{ display: showSlides ? null : "none" }}
              >
                <HeroSlider
                  data={slides}
                  removeSlide={removeSlide}
                  updateSlide={updateSlide}
                />

                <footer className={herocss.footer}>
                  {needsToBeSaved && (
                    <>
                      <Button variant="outlined" onClick={() => saveChanges()}>
                        Guardar
                      </Button>
                      <Button
                        size="large"
                        color="alizarin"
                        variant="outlined"
                        onClick={() => setSlides(backup)}
                      >
                        Restablecer
                      </Button>
                    </>
                  )}

                  <input
                    type="file"
                    accept=".jpg, .jpeg, .png, .gif"
                    ref={input_new}
                    onChange={newSlide}
                  />
                  <Button
                    color="green-sea"
                    variant="outlined"
                    onClick={() => input_new.current?.click()}
                  >
                    <Icon name="image@bold" />
                    Agregar nuevo
                  </Button>
                </footer>
              </div>
            </>
          )}
        </div>
      </Board>
    </>
  );
}
