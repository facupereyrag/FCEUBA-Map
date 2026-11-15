import React from "react";
import { CARRERAS } from "./carreras";
import { UserType } from "./types/User";

const STORAGE_KEY = "fiuba-map-local-progress-v1";
const LOCAL_ID = "local";
const emptyRecord: UserType.DBRecord = {
  padron: LOCAL_ID,
  ultimaCarrera: "contador-2019",
  carreras: {},
};

const readRecord = (): UserType.DBRecord => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRecord;
    const parsed = JSON.parse(raw) as UserType.DBRecord;
    if (!parsed || typeof parsed !== "object" || !parsed.carreras) return emptyRecord;
    return { ...emptyRecord, ...parsed, padron: LOCAL_ID };
  } catch {
    return emptyRecord;
  }
};

const Login = (): UserType.Context => {
  const [record, setRecord] = React.useState<UserType.DBRecord>(() => readRecord());
  const [padronInput, setPadronInput] = React.useState("");
  const carrera =
    CARRERAS.find((c) => c.id === record.ultimaCarrera) ??
    CARRERAS.find((c) => c.id === "contador-2019")!;
  const carreraData = record.carreras[carrera.id];
  const orientacion = carreraData?.orientacion
    ? carrera.orientaciones?.find((o) => o.nombre === carreraData.orientacion)
    : undefined;
  const finDeCarrera = carreraData?.finDeCarrera
    ? carrera.finDeCarrera?.find((f) => f.id === carreraData.finDeCarrera)
    : undefined;

  const [user, setUser] = React.useState<UserType.Info>(() => ({
    padron: LOCAL_ID,
    carrera,
    orientacion,
    finDeCarrera,
    record,
  }));

  const login = async (_padron: string): Promise<UserType.LoginResult> => "ok";
  const signup = (_padron: string) => undefined;
  const logout = () => undefined;

  const saveUserGraph: UserType.SaveGraph = async (
    currentUser,
    materias,
    checkboxes,
    optativas,
    aplazos,
  ) => {
    const carreras = { ...currentUser.record.carreras };
    if (materias.length <= 1) {
      delete carreras[currentUser.carrera.id];
    } else {
      carreras[currentUser.carrera.id] = {
        materias,
        ...(currentUser.orientacion && { orientacion: currentUser.orientacion.nombre }),
        ...(currentUser.finDeCarrera && { finDeCarrera: currentUser.finDeCarrera.id }),
        ...(checkboxes?.length && { checkboxes }),
        ...(optativas.length && { optativas }),
        ...(aplazos && { aplazos }),
      };
    }
    const nextRecord: UserType.DBRecord = {
      ...currentUser.record,
      padron: LOCAL_ID,
      ultimaCarrera: currentUser.carrera.id,
      carreras,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecord));
    setRecord(nextRecord);
    setUser({ ...currentUser, record: nextRecord });
  };

  React.useEffect(() => {
    setUser((current) => ({
      ...current,
      carrera,
      orientacion,
      finDeCarrera,
      record,
    }));
  }, [record, carrera, orientacion, finDeCarrera]);

  return {
    user,
    logged: true,
    login,
    loading: false,
    logout,
    setUser,
    padronInput,
    setPadronInput,
    loggingIn: false,
    dbUnavailable: false,
    saveUserGraph,
    signup,
  };
};

export default Login;
