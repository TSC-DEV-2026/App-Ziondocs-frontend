import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SearchDocumentItem } from "@/types/documents";
import { styles } from "./styles";

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

type PickerMode = "month-year" | "year";
type DocumentMode =
  | "holerite"
  | "beneficios"
  | "ferias"
  | "informe_rendimentos"
  | "generico";

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

export type DiscoveryOption = {
  key: string;
  label: string;
  badge?: string;
  onPress: () => void;
};

function formatCpfInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9, 11)}`;
}

function getDisplayCompetencia(value: string, mode: PickerMode) {
  if (!value) {
    return mode === "year" ? "Selecionar ano" : "Selecionar período";
  }

  if (mode === "year") {
    const digits = String(value).replace(/\D/g, "").slice(0, 4);
    return digits || "Selecionar ano";
  }

  const normalized = value.includes("-")
    ? value
    : value.length === 6
      ? `${value.slice(0, 4)}-${value.slice(4, 6)}`
      : value;

  const [year, month] = normalized.split("-");
  const monthName = MONTHS.find((m) => m.value === month)?.label;

  if (!monthName || !year) return value;

  return `${monthName} ${year}`;
}

function formatAnoMesTable(value?: string) {
  if (!value) return "-";

  const digits = String(value).replace(/\D/g, "");

  if (digits.length === 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
  }

  if (digits.length === 4) {
    return digits;
  }

  if (/^\d{4}-\d{2}$/.test(String(value))) {
    return String(value);
  }

  return String(value);
}

function InputRow({
  label,
  value,
  displayValue,
  onChangeText,
  keyboardType,
  maxLength,
  placeholder,
  onFocus,
  onBlur,
  editable = true,
}: {
  label: string;
  value: string;
  displayValue?: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric";
  maxLength?: number;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, !editable ? styles.fieldInputDisabled : null]}
        value={displayValue ?? value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#9aa79b"
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType="done"
        autoCorrect={false}
        autoCapitalize="none"
        selectionColor="#2f8b1d"
        underlineColorAndroid="transparent"
        editable={editable}
      />
    </View>
  );
}

function SelectRow({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled = false,
  loading = false,
  onOpen,
}: {
  label: string;
  value?: string;
  placeholder: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const found = options.find((item) => item.value === value);
    return found?.label || "";
  }, [options, value]);

  return (
    <>
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>

        <Pressable
          onPress={() => {
            if (disabled || loading) return;
            onOpen?.();
            setOpen(true);
          }}
          style={[
            styles.selectButton,
            disabled ? styles.selectButtonDisabled : null,
          ]}
        >
          <View style={styles.selectButtonLeft}>
            {loading ? (
              <ActivityIndicator size="small" color="#2f8b1d" />
            ) : (
              <Ionicons name="list-outline" size={18} color="#5a695d" />
            )}

            <Text
              style={[
                styles.selectButtonText,
                !selectedLabel ? styles.selectButtonPlaceholder : null,
              ]}
              numberOfLines={2}
            >
              {selectedLabel || placeholder}
            </Text>
          </View>

          <Ionicons name="chevron-down-outline" size={18} color="#7b8d81" />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View style={styles.pickerBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{label}</Text>

            <View style={styles.selectorScrollWrapper}>
              <ScrollView
                style={styles.pickerScroll}
                contentContainerStyle={styles.pickerScrollContent}
                showsVerticalScrollIndicator
                persistentScrollbar
                nestedScrollEnabled
              >
                {options.length === 0 ? (
                  <View style={styles.selectorEmptyBox}>
                    <Text style={styles.selectorEmptyText}>
                      Nenhuma opção disponível.
                    </Text>
                  </View>
                ) : (
                  options.map((item) => {
                    const active = item.value === value;

                    return (
                      <Pressable
                        key={`${label}-${item.value}`}
                        onPress={() => {
                          onSelect(item.value);
                          setOpen(false);
                        }}
                        style={[
                          styles.selectorOption,
                          active ? styles.selectorOptionActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectorOptionTitle,
                            active ? styles.selectorOptionTitleActive : null,
                          ]}
                        >
                          {item.label}
                        </Text>

                        {item.description ? (
                          <Text
                            style={[
                              styles.selectorOptionDescription,
                              active
                                ? styles.selectorOptionDescriptionActive
                                : null,
                            ]}
                          >
                            {item.description}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>

            <Pressable
              onPress={() => setOpen(false)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MonthYearPicker({
  value,
  onChange,
  onOpen,
  mode = "month-year",
}: {
  value: string;
  onChange: (value: string) => void;
  onOpen?: () => void;
  mode?: PickerMode;
}) {
  const [open, setOpen] = useState(false);

  const parsedValue = useMemo(() => {
    if (!value) {
      return { year: "", month: "" };
    }

    if (mode === "year") {
      return {
        year: String(value).replace(/\D/g, "").slice(0, 4),
        month: "",
      };
    }

    const normalized = value.includes("-")
      ? value
      : value.length === 6
        ? `${value.slice(0, 4)}-${value.slice(4, 6)}`
        : value;

    const [year, month] = normalized.split("-");
    return {
      year: year || "",
      month: month || "",
    };
  }, [value, mode]);

  const [selectedYear, setSelectedYear] = useState(parsedValue.year);
  const [selectedMonth, setSelectedMonth] = useState(parsedValue.month);

  React.useEffect(() => {
    setSelectedYear(parsedValue.year);
    setSelectedMonth(parsedValue.month);
  }, [parsedValue.year, parsedValue.month]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => String(currentYear - i));

  const handleApply = () => {
    if (!selectedYear) return;

    if (mode === "year") {
      onChange(selectedYear);
      setOpen(false);
      return;
    }

    if (!selectedMonth) return;

    onChange(`${selectedYear}-${selectedMonth}`);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedYear("");
    setSelectedMonth("");
    onChange("");
    setOpen(false);
  };

  const canApply =
    mode === "year" ? !!selectedYear : !!selectedYear && !!selectedMonth;

  const isYearMode = mode === "year";

  return (
    <>
      <Pressable
        onPress={() => {
          onOpen?.();
          setOpen(true);
        }}
        style={styles.periodButton}
      >
        <View style={styles.periodButtonLeft}>
          <Ionicons name="calendar-outline" size={18} color="#5a695d" />
          <Text style={styles.periodButtonText}>
            {getDisplayCompetencia(value, mode)}
          </Text>
        </View>
        <Ionicons name="chevron-down-outline" size={18} color="#7b8d81" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View style={styles.pickerBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>
              {isYearMode ? "Selecionar ano" : "Selecionar período"}
            </Text>

            {isYearMode ? (
              <View style={styles.yearPickerBlock}>
                <View style={styles.pickerScrollWrapperYear}>
                  <ScrollView
                    style={styles.pickerScroll}
                    contentContainerStyle={styles.pickerScrollContent}
                    showsVerticalScrollIndicator
                    persistentScrollbar
                    indicatorStyle="default"
                    nestedScrollEnabled
                  >
                    {years.map((year) => (
                      <Pressable
                        key={year}
                        onPress={() => setSelectedYear(year)}
                        style={[
                          styles.pickerOption,
                          selectedYear === year
                            ? styles.pickerOptionActive
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            selectedYear === year
                              ? styles.pickerOptionTextActive
                              : null,
                          ]}
                        >
                          {year}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : (
              <View style={styles.pickerColumns}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerColumnTitle}>Ano</Text>

                  <View style={styles.pickerScrollWrapper}>
                    <ScrollView
                      style={styles.pickerScroll}
                      contentContainerStyle={styles.pickerScrollContent}
                      showsVerticalScrollIndicator
                      persistentScrollbar
                      indicatorStyle="default"
                      nestedScrollEnabled
                    >
                      {years.map((year) => (
                        <Pressable
                          key={year}
                          onPress={() => setSelectedYear(year)}
                          style={[
                            styles.pickerOption,
                            selectedYear === year
                              ? styles.pickerOptionActive
                              : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              selectedYear === year
                                ? styles.pickerOptionTextActive
                                : null,
                            ]}
                          >
                            {year}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerColumnTitle}>Mês</Text>

                  <View style={styles.pickerScrollWrapper}>
                    <ScrollView
                      style={styles.pickerScroll}
                      contentContainerStyle={styles.pickerScrollContent}
                      showsVerticalScrollIndicator
                      persistentScrollbar
                      indicatorStyle="default"
                      nestedScrollEnabled
                    >
                      {MONTHS.map((month) => (
                        <Pressable
                          key={month.value}
                          onPress={() => setSelectedMonth(month.value)}
                          style={[
                            styles.pickerOption,
                            selectedMonth === month.value
                              ? styles.pickerOptionActive
                              : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              selectedMonth === month.value
                                ? styles.pickerOptionTextActive
                                : null,
                            ]}
                          >
                            {month.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.scrollHintBottom}>
              <Ionicons name="chevron-up" size={16} color="#7c927f" />
              <Text style={styles.scrollHintText}>
                Role para cima ou para baixo
              </Text>
              <Ionicons name="chevron-down" size={16} color="#7c927f" />
            </View>

            <View style={styles.pickerActions}>
              <Pressable
                onPress={handleApply}
                disabled={!canApply}
                style={[
                  styles.primaryButton,
                  !canApply ? styles.primaryButtonDisabled : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>Aplicar</Text>
              </Pressable>

              <Pressable onPress={handleClear} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Limpar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function DiscoveryInfoBanner({ text }: { text: string }) {
  return (
    <View style={styles.discoveryBanner}>
      <Text style={styles.discoveryBannerText}>{text}</Text>
    </View>
  );
}

export function DiscoveryActionCard({
  title,
  children,
  loading = false,
  emptyText,
  actionLabel,
  onAction,
  compact = false,
  topDivider = false,
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  emptyText?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  topDivider?: boolean;
}) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <View
      style={[
        styles.discoveryCard,
        compact ? styles.discoveryCardCompact : null,
        topDivider ? styles.discoveryCardTopDivider : null,
      ]}
    >
      {title ? <Text style={styles.discoveryTitle}>{title}</Text> : null}

      {loading ? (
        <View style={styles.discoveryLoadingBox}>
          <ActivityIndicator size="large" color="#0b4c1b" />
          <Text style={styles.discoveryLoadingText}>Carregando...</Text>
        </View>
      ) : hasChildren ? (
        children
      ) : emptyText ? (
        <DiscoveryInfoBanner text={emptyText} />
      ) : null}

      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.discoverySecondaryButton}>
          <Text style={styles.discoverySecondaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DiscoveryGridSection({
  title,
  options,
  selectedLabel,
  onReset,
  resetLabel = "Trocar",
  emptyText,
  autoInfo,
  gridVariant = "default",
  selectedVariant = "default",
}: {
  title: string;
  options?: DiscoveryOption[];
  selectedLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  emptyText?: string;
  autoInfo?: string;
  gridVariant?: "default" | "compact";
  selectedVariant?: "default" | "auto";
}) {
  const hasSelection = !!selectedLabel;
  const hasOptions = !!options?.length;
  const optionCount = options?.length ?? 0;
  const useCompact = gridVariant === "compact";

  const isPlainCompactBlock =
    useCompact && !title && !hasSelection && hasOptions;

  if (isPlainCompactBlock) {
    return (
      <View style={[styles.discoveryGrid, styles.discoveryGridCompact]}>
        {options!.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            style={[
              styles.discoveryPrimaryButton,
              styles.discoveryPrimaryButtonCompact,
            ]}
          >
            <Text style={styles.discoveryPrimaryButtonText} numberOfLines={2}>
              {item.label}
            </Text>

            {item.badge ? (
              <View style={styles.discoveryBadge}>
                <Text style={styles.discoveryBadgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.discoveryCard}>
      {title ? <Text style={styles.discoveryTitle}>{title}</Text> : null}

      {!hasSelection ? (
        hasOptions ? (
          <View
            style={[
              styles.discoveryGrid,
              useCompact ? styles.discoveryGridCompact : null,
            ]}
          >
            {options!.map((item) => {
              const buttonStyle = useCompact
                ? styles.discoveryPrimaryButtonCompact
                : optionCount === 1
                  ? styles.discoveryPrimaryButtonFull
                  : styles.discoveryPrimaryButtonHalf;

              return (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  style={[styles.discoveryPrimaryButton, buttonStyle]}
                >
                  <Text
                    style={styles.discoveryPrimaryButtonText}
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>

                  {item.badge ? (
                    <View style={styles.discoveryBadge}>
                      <Text style={styles.discoveryBadgeText}>
                        {item.badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <DiscoveryInfoBanner
            text={emptyText || "Nenhuma opção disponível."}
          />
        )
      ) : (
        <View style={styles.discoverySelectedBox}>
          {selectedVariant === "auto" ? (
            <View style={styles.discoverySelectedAutoBox}>
              <Text style={styles.discoverySelectedAutoText}>
                {selectedLabel}
              </Text>
            </View>
          ) : (
            <Text style={styles.discoverySelectedLabel}>
              Selecionada:{" "}
              <Text style={styles.discoverySelectedLabelStrong}>
                {selectedLabel}
              </Text>
            </Text>
          )}

          {onReset ? (
            <Pressable onPress={onReset} style={styles.discoverySecondaryButton}>
              <Text style={styles.discoverySecondaryButtonText}>
                {resetLabel}
              </Text>
            </Pressable>
          ) : null}

          {autoInfo ? (
            <Text style={styles.discoveryAutoInfo}>{autoInfo}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export function FiltersCard({
  title,
  cpf,
  setCpf,
  matricula,
  setMatricula,
  empresa,
  setEmpresa,
  competencia,
  setCompetencia,
  onBack,
  onSearch,
  loadingSearch,
  onFieldFocus,
  showEmpresaField = true,
  showMatriculaField = true,
  pickerMode = "month-year",
  isNonGestor = false,
  meLoading = false,
  empresaOptions = [],
  selectedEmpresaId = "",
  setSelectedEmpresaId,
  matriculaOptions = [],
  selectedMatricula = "",
  setSelectedMatricula,
  hideSearchButton = false,
  hidePeriodPicker = false,
  hideCpfField = false,
  staticInfoText,
}: {
  title: string;
  cpf: string;
  setCpf: (v: string) => void;
  matricula: string;
  setMatricula: (v: string) => void;
  empresa: string;
  setEmpresa: (v: string) => void;
  competencia: string;
  setCompetencia: (v: string) => void;
  onBack: () => void;
  onSearch: () => void;
  loadingSearch: boolean;
  onFieldFocus?: () => void;
  showEmpresaField?: boolean;
  showMatriculaField?: boolean;
  pickerMode?: PickerMode;
  isNonGestor?: boolean;
  meLoading?: boolean;
  empresaOptions?: SelectOption[];
  selectedEmpresaId?: string;
  setSelectedEmpresaId?: (value: string) => void;
  matriculaOptions?: SelectOption[];
  selectedMatricula?: string;
  setSelectedMatricula?: (value: string) => void;
  hideSearchButton?: boolean;
  hidePeriodPicker?: boolean;
  hideCpfField?: boolean;
  staticInfoText?: string;
}) {
  const hasManyMatriculas = matriculaOptions.length > 1;
  const singleMatricula =
    matriculaOptions.length === 1 ? matriculaOptions[0].value : "";

  return (
    <View style={styles.filtersCard}>
      <View style={styles.backRow}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color="#1f2a22" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </View>

      <Text style={styles.pageTitle}>{title}</Text>

      {staticInfoText ? (
        <View style={styles.staticInfoBox}>
          <Text style={styles.staticInfoText}>{staticInfoText}</Text>
        </View>
      ) : null}

      {showEmpresaField &&
        (isNonGestor ? (
          <SelectRow
            label="Empresa"
            value={selectedEmpresaId}
            placeholder={
              meLoading ? "Carregando empresas..." : "Selecione a empresa"
            }
            options={empresaOptions}
            onSelect={(value) => {
              setEmpresa(value);
              setSelectedEmpresaId?.(value);
            }}
            disabled={meLoading}
            loading={meLoading}
            onOpen={onFieldFocus}
          />
        ) : (
          <InputRow
            label="Empresa"
            value={empresa}
            onChangeText={setEmpresa}
            placeholder="Empresa"
            onFocus={onFieldFocus}
          />
        ))}

      {!hideCpfField &&
        (isNonGestor ? (
          <InputRow
            label="CPF"
            value={cpf}
            displayValue={formatCpfInput(cpf)}
            onChangeText={() => {}}
            keyboardType="numeric"
            maxLength={14}
            placeholder="CPF"
            editable={false}
          />
        ) : (
          <InputRow
            label="CPF"
            value={cpf}
            displayValue={formatCpfInput(cpf)}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, "").slice(0, 11);
              setCpf(digits);
            }}
            keyboardType="numeric"
            maxLength={14}
            placeholder="CPF"
            onFocus={onFieldFocus}
          />
        ))}

      {showMatriculaField &&
        (isNonGestor ? (
          hasManyMatriculas ? (
            <SelectRow
              label="Matrícula"
              value={selectedMatricula}
              placeholder="Selecione a matrícula"
              options={matriculaOptions}
              onSelect={(value) => {
                setMatricula(value);
                setSelectedMatricula?.(value);
              }}
              disabled={meLoading || !selectedEmpresaId}
              loading={false}
              onOpen={onFieldFocus}
            />
          ) : (
            <InputRow
              label="Matrícula"
              value={singleMatricula || matricula}
              onChangeText={() => {}}
              placeholder="Matrícula"
              editable={false}
            />
          )
        ) : (
          <InputRow
            label="Matrícula"
            value={matricula}
            onChangeText={setMatricula}
            placeholder="Matrícula"
            onFocus={onFieldFocus}
          />
        ))}

      {!hidePeriodPicker ? (
        <View style={styles.periodRow}>
          <MonthYearPicker
            value={competencia}
            onChange={setCompetencia}
            onOpen={onFieldFocus}
            mode={pickerMode}
          />
        </View>
      ) : null}

      {!hideSearchButton ? (
        <Pressable
          onPress={onSearch}
          style={[
            styles.searchButton,
            loadingSearch ? styles.searchButtonDisabled : null,
          ]}
          disabled={loadingSearch}
        >
          {loadingSearch ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function normalizeHoleriteTipoCalculoForTable(value?: unknown): string {
  const raw = String(value ?? "").trim().toUpperCase();

  if (raw === "A") return "A";
  if (raw === "P") return "P";

  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

  if (normalized.includes("adiant")) return "A";
  if (normalized.includes("pagamento")) return "P";

  return raw || "";
}

function resolveHoleriteDescricaoForTable(item: any): string {
  const tipo = normalizeHoleriteTipoCalculoForTable(item?.tipo_calculo);
  const descricao = String(item?.descricao ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

  if (descricao.includes("adiant")) return "Adiantamento";
  if (descricao.includes("pagamento")) return "Pagamento";
  if (tipo === "A") return "Adiantamento";
  if (tipo === "P") return "Pagamento";

  return String(item?.descricao ?? "").trim() || "Holerite";
}

export function ResultsTable({
  items,
  loading,
  competencia,
  onOpenItem,
  mode = "generico",
}: {
  items: SearchDocumentItem[];
  loading: boolean;
  competencia: string;
  onOpenItem: (item: any) => void;
  mode?: DocumentMode;
}) {
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#0b4c1b" />
        <Text style={styles.loadingText}>Buscando documentos...</Text>
      </View>
    );
  }

  const showLote = mode === "holerite" || mode === "beneficios";
  const showTipo = mode === "holerite";
  const headerLeft = mode === "informe_rendimentos" ? "ANO" : "ANO/MÊS";

  return (
    <View style={styles.tableCard}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderTextLeft, { flex: showTipo ? 0.9 : 1.05 }]}>
          {headerLeft}
        </Text>

        {showLote ? (
          <Text style={[styles.tableHeaderTextCenter, { width: showTipo ? 72 : 82 }]}>
            LOTE
          </Text>
        ) : null}

        {showTipo ? (
          <Text
            style={[
              styles.tableHeaderTextCenter,
              { width: 130, textAlign: "center" },
            ]}
          >
            TIPO
          </Text>
        ) : null}

        <Text style={styles.tableHeaderTextRight}>AÇÕES</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.tableBody}>
          <Text style={styles.emptyTableText}>Nenhum documento encontrado.</Text>
        </View>
      ) : (
        items.map((item, index) => {
          const tipoLabel =
            mode === "holerite"
              ? resolveHoleriteDescricaoForTable(item)
              : "";

          return (
            <View key={`${item.id_documento}-${index}`} style={styles.tableRow}>
              <View style={styles.tableRowMain}>
                <View style={[styles.tableColLeft, { flex: showTipo ? 0.9 : 1.05 }]}>
                  <Text style={styles.tableCellLeft}>
                    {formatAnoMesTable(item.anomes || competencia || "-")}
                  </Text>
                </View>

                {showLote ? (
                  <View style={[styles.tableColCenter, { width: showTipo ? 72 : 82 }]}>
                    <Text style={styles.tableCellCenter}>
                      {item.id_documento || "-"}
                    </Text>
                  </View>
                ) : null}

                {showTipo ? (
                  <View
                    style={{
                      width: 130,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color:
                          tipoLabel === "Adiantamento" ? "#8a5a14" : "#25601d",
                        textAlign: "center",
                      }}
                    >
                      {tipoLabel}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={showLote ? styles.tableColRight : styles.tableColRightWide}
                >
                  <Pressable
                    onPress={() => onOpenItem(item)}
                    style={({ pressed }) => [
                      styles.visualizarButton,
                      pressed ? styles.visualizarButtonPressed : null,
                    ]}
                  >
                    <Text style={styles.visualizarButtonText}>Visualizar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

export function ListarSideMenu({
  visible,
  fullName,
  documentValue,
  onClose,
  onGoHome,
  onLogout,
}: {
  visible: boolean;
  fullName: string;
  documentValue: string;
  onClose: () => void;
  onGoHome: () => void;
  onLogout: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.menuOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.menuBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.menuPanel}>
          <View style={styles.menuTop}>
            <Text style={styles.menuTitle}>Menu</Text>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <Ionicons name="person-circle-outline" size={42} color="#ffffff" />
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileDocument}>{documentValue}</Text>
          </View>

          <Pressable onPress={onGoHome} style={styles.menuItemPlain}>
            <Ionicons name="home-outline" size={20} color="#ffffff" />
            <Text style={styles.menuItemPlainText}>Início</Text>
          </Pressable>

          <Pressable style={styles.menuItemBorder}>
            <Ionicons name="sunny-outline" size={20} color="#ffffff" />
            <Text style={styles.menuItemBorderText}>Tema</Text>
          </Pressable>

          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#ff2d20" />
            <Text style={styles.logoutButtonText}>Sair</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}