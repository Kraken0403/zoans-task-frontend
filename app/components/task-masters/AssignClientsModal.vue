<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getClients } from '@/services/clients.service'
import {
  assignTaskMasterClients,
} from '@/services/task-masters.service'

const props = defineProps<{ taskMaster: any }>()
const emit = defineEmits(['close'])

const clients = ref<any[]>([])
const selected = ref<number[]>([])

onMounted(async () => {
  const { data } = await getClients()
  clients.value = data
  selected.value =
    props.taskMaster.clients?.map((c: any) => c.id) || []
})

const submit = async () => {
  await assignTaskMasterClients(props.taskMaster.id, selected.value)
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white w-full max-w-md rounded-md shadow">
      <div class="px-5 py-4 border-b font-semibold">
        Assign Clients
      </div>

      <div class="p-5 max-h-80 overflow-auto text-sm">
        <label
          v-for="c in clients"
          :key="c.id"
          class="flex gap-2 py-1"
        >
          <input
            type="checkbox"
            :value="c.id"
            v-model="selected"
          />
          {{ c.name }}
        </label>
      </div>

      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="btn-secondary" @click="$emit('close')">
          Cancel
        </button>
        <button class="btn-primary" @click="submit">
          Save
        </button>
      </div>
    </div>
  </div>
</template>
