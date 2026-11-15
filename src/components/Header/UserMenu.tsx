import React from "react";
import { SettingsIcon } from "@chakra-ui/icons";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Icon,
  IconButton,
  Tooltip,
  Text,
  Box,
  PlacementWithLogical,
  ResponsiveValue,
  useToast,
} from "@chakra-ui/react";
import { Property } from "csstype";
import { FaSave, FaUndo, FaFileImport, FaFileExport } from "react-icons/fa";
import { GraphContext, UserContext } from "../../MapContext";

const ButtonProps = {
  bg: "teal.500",
  color: "white",
  _hover: { bg: "teal.600" },
  _active: { bg: "teal.600" },
  size: "sm",
};

const TooltipProps = {
  closeOnClick: true,
  hasArrow: true,
  placement: "bottom" as PlacementWithLogical,
  textAlign: "center" as ResponsiveValue<Property.TextAlign>,
};

// Menu para elegir orientacion y fin de carrera (y para "cerrar sesion")
// Es un botoncito de settings donde esta el padron, arriba a la izquierda de la app
// Tambien botones para guardar el grafo, y reiniciar los cuatrimestres planeados
const UserMenu = () => {
  const { user } = React.useContext(UserContext);

  const {
    saveGraph,
    restartGraphCuatris,
    getters,
    changeOrientacion,
    changeFinDeCarrera,
    getNode,
  } = React.useContext(GraphContext);
  const [saving, setSaving] = React.useState(false);
  const importInput = React.useRef<HTMLInputElement>(null);
  const toast = useToast();

  const exportProgress = () => {
    const raw = window.localStorage.getItem("fiuba-map-local-progress-v1");
    if (!raw) {
      toast({ status: "warning", title: "Todavía no hay datos guardados" });
      return;
    }
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "progreso-contador-uba.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ status: "success", title: "Copia de seguridad descargada" });
  };

  const importProgress = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !parsed.carreras ||
          typeof parsed.carreras !== "object" ||
          typeof parsed.ultimaCarrera !== "string"
        ) {
          throw new Error("Formato inválido");
        }
        parsed.padron = "local";
        window.localStorage.setItem(
          "fiuba-map-local-progress-v1",
          JSON.stringify(parsed),
        );
        toast({
          status: "success",
          title: "Progreso importado",
          description: "La aplicación se va a recargar para mostrar los datos.",
          duration: 3000,
        });
        window.setTimeout(() => window.location.reload(), 900);
      } catch {
        toast({
          status: "error",
          title: "No se pudo importar el archivo",
          description: "Elegí una copia JSON exportada desde esta aplicación.",
          duration: 5000,
        });
      }
    };
    reader.readAsText(file);
  };

  const isBeta = user.carrera.beta;
  return (
    <Box>
      <input
        ref={importInput}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={(event) => {
          importProgress(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Menu
        closeOnSelect={false}
        defaultIsOpen={
          (user.carrera.eligeOrientaciones && !user.orientacion) ||
          (user.carrera.finDeCarrera && !user.finDeCarrera)
        }
      >
        <MenuButton
          w="20ch"
          textAlign="left"
          as={Button}
          leftIcon={<SettingsIcon />}
          {...ButtonProps}
        >
          <Text overflow="hidden" textOverflow="ellipsis">
            {"Progreso local"}
          </Text>
        </MenuButton>
        <MenuList>
          {user.carrera.finDeCarrera && (
            <MenuOptionGroup
              onChange={(value) => {
                changeFinDeCarrera(value as string);
              }}
              value={user.finDeCarrera?.id || "none"}
              title="Fin de Carrera"
              type="radio"
            >
              <MenuItemOption type="checkbox" value={"none"}>
                No me decidí
              </MenuItemOption>

              {user.carrera.finDeCarrera &&
                Object.values(user.carrera.finDeCarrera).map((v) => (
                  <MenuItemOption type="checkbox" value={v.id} key={v.id}>
                    {getNode(v.materia)?.materia}
                  </MenuItemOption>
                ))}
            </MenuOptionGroup>
          )}

          {user.carrera.eligeOrientaciones && (
            <MenuOptionGroup
              onChange={(value) => {
                changeOrientacion(value as string);
              }}
              value={user.orientacion?.nombre || "none"}
              title="Orientación"
              type="radio"
            >
              <MenuItemOption type="checkbox" value={"none"}>
                No me decidí
              </MenuItemOption>

              {user.carrera.orientaciones &&
                user.carrera.orientaciones
                  .filter((o) => !o.nonEligible)
                  .map((o) => (
                    <MenuItemOption
                      type="checkbox"
                      value={o.nombre}
                      key={o.nombre}
                    >
                      {o.nombre}
                    </MenuItemOption>
                  ))}
            </MenuOptionGroup>
          )}

          <MenuItem isDisabled>Progreso guardado en este navegador</MenuItem>
          <MenuItem icon={<Icon as={FaFileExport} />} onClick={exportProgress}>
            Exportar progreso
          </MenuItem>
          <MenuItem
            icon={<Icon as={FaFileImport} />}
            onClick={() => importInput.current?.click()}
          >
            Importar progreso
          </MenuItem>
        </MenuList>
      </Menu>
      <Tooltip
        {...TooltipProps}
        label={
          isBeta
            ? "No se pueden guardar datos hasta que se oficialice el plan"
            : "Guardar datos"
        }
      >
        <IconButton
          {...ButtonProps}
          ml={2}
          isLoading={saving}
          onClick={async () => {
            setSaving(true);
            await saveGraph().catch((err) => {
              console.error(err);
              toast({
                status: "error",
                variant: "subtle",
                title: "Error al guardar los datos",
                duration: 4000,
                isClosable: true,
              });
            });
            setSaving(false);
          }}
          isDisabled={isBeta}
          aria-label="Guardar los datos del plan"
        >
          <Icon boxSize={5} as={FaSave} />
        </IconButton>
      </Tooltip>

      {getters.Cuatrimestres().length > 0 && (
        <Tooltip {...TooltipProps} label="Limpiar todos los cuatris">
          <IconButton
            {...ButtonProps}
            ml={2}
            onClick={restartGraphCuatris}
            aria-label="Limpiar la data de los cuatrimestres"
          >
            <Icon boxSize={4} as={FaUndo} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default UserMenu;
