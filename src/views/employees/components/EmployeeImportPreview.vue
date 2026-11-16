<template>
  <!-- pregled redova iz CSV-a prije uvoza, redovi sa greškom su označeni -->
  <div class="import-preview">
    <table class="import-preview__table">
      <thead>
        <tr>
          <th scope="col">{{ $t("employees.import.row") }}</th>
          <th v-for="field in IMPORT_FIELDS" :key="field" scope="col">
            {{ $t(`employees.import.columns.${field}`) }}
          </th>
          <th scope="col">{{ $t("employees.import.columns.status") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.line" :class="{ 'is-invalid': row.errors.length }">
          <td class="import-preview__line">{{ row.line }}</td>
          <td v-for="field in IMPORT_FIELDS" :key="field" :title="row.values[field]">
            {{ row.values[field] || "—" }}
          </td>
          <td>
            <span v-if="!row.errors.length" class="import-preview__ok">
              <VIcon name="check_circle" :size="16" filled />
            </span>
            <span v-else class="import-preview__errors">
              {{ row.errors.map((code) => $t(`employees.import.errors.${code}`)).join(", ") }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";
import { IMPORT_FIELDS } from "../import-csv";

defineProps({
  // [{ line, values, errors }] iz parseEmployeesCsv
  rows: { type: Array, required: true }
});
</script>

<style lang="scss" scoped>
.import-preview {
  max-height: 20rem;
  overflow: auto;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xs;

  &__table {
    width: 100%;
    font-size: $text-12;
    line-height: $leading-xs;
    border-collapse: collapse;
  }

  th,
  td {
    max-width: 10rem;
    padding: $space-8;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 1px solid $border-default;
  }

  th {
    position: sticky;
    top: 0;
    font-weight: $weight-semibold;
    color: $fg-heading;
    background: $surface-table-head;
  }

  td {
    color: $fg-heading;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.is-invalid td {
    background: alpha($fg-error, 0.06);
  }

  &__line {
    color: $fg-body;
  }

  &__ok {
    display: inline-flex;
    color: $fg-success;
  }

  &__errors {
    color: $fg-error;
    white-space: normal;
  }
}
</style>
