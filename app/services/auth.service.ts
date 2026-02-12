export const login = async (
  identifier: string,
  password: string,
) => {
  const { $api } = useNuxtApp()

  const res = await $api.post('/auth/login', {
    identifier,
    password,
  })

  return res.data
}
