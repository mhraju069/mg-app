import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/shared/avatar";
import { BackHeader } from "@/components/shared/booking-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/utils/authStore";
import { useToast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/utils/constants";

export default function EditProfileScreen() {
  const textMuted = useColor("textMuted");
  const authUser = useAuthStore.getState().user;
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const [name, setName] = useState(authUser?.name || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [phone, setPhone] = useState(authUser?.phone || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = useAuthStore.getState();
    if (auth.user) {
      setName(auth.user.name || "");
      setEmail(auth.user.email || "");
      setPhone(auth.user.phone || "");
      setBio(auth.user.bio || "");
    }
  }, []);

  const handleSaveChanges = async () => {
    const auth = useAuthStore.getState();
    if (!auth.accessToken) {
      showErrorToast("Not authenticated", "Please login to update your profile.");
      return;
    }

    if (!name.trim()) {
      showErrorToast("Validation Error", "Full Name is required.");
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      let res: Response;
      if (newAvatarUri && !newAvatarUri.startsWith("http")) {
        // Multipart upload
        const formData = new FormData();
        formData.append("name", name.trim());
        if (phone.trim()) formData.append("phone", phone.trim());
        if (bio.trim()) formData.append("bio", bio.trim());

        const filename = newAvatarUri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("image", {
          uri: newAvatarUri,
          name: filename,
          type,
        } as any);

        res = await fetch(`${API_BASE_URL}/auth/user/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: formData,
        });
      } else {
        res = await fetch(`${API_BASE_URL}/auth/user/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            bio: bio.trim(),
          }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        useAuthStore.setUser(data);
        showSuccessToast("Profile Updated", "Your profile details have been saved.");
        router.back();
      } else {
        const msg = data.detail || data.log || "Failed to update profile.";
        setErrorMessage(msg);
        showErrorToast("Update Failed", msg);
      }
    } catch (e: any) {
      const msg = e.message || "Network error while saving profile.";
      setErrorMessage(msg);
      showErrorToast("Update Failed", msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <BackHeader />
      <Layout>
        <View style={styles.avatarSection}>
          <Avatar
            editable={true}
            defaultValue={
              authUser?.image ||
              authUser?.avatar ||
              authUser?.profile_picture ||
              (authUser?.name
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    authUser.name
                  )}&background=9B7C56&color=fff&size=160`
                : undefined)
            }
            onChange={(uri) => setNewAvatarUri(uri)}
          />
        </View>

        {errorMessage ? (
          <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FCA5A5" }}>
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            variant="outline"
          />
          <Input
            label="Email Address (Registered)"
            value={email}
            editable={false}
            variant="outline"
          />
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            variant="outline"
            keyboardType="phone-pad"
            placeholder="+31 6 12345678"
          />
          <Input
            label="Bio / Notes"
            value={bio}
            onChangeText={setBio}
            variant="outline"
            placeholder="Tell us about your wellness preferences"
          />

          <View style={styles.inputGroup}>
            <Text
              variant="caption"
              style={{ color: textMuted, marginBottom: 8, marginLeft: 4 }}
            >
              Preferred Language
            </Text>
            <Pressable
              style={styles.languageSelector}
              onPress={() => router.push("/(tabs)/profile/language")}
            >
              <Text>English</Text>
              <Text style={{ color: textMuted }}>▼</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Button variant="outline" onPress={() => router.back()} disabled={isSaving}>
            Cancel
          </Button>
          <Button onPress={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : "Save Changes"}
          </Button>
        </View>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  form: {
    gap: 20,
    marginBottom: 40,
  },
  inputGroup: {
    gap: 4,
  },
  languageSelector: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
   //   justifyContent: "center",
     justifyContent: "space-between",
   //   gap: 16,
    marginBottom: 40,
  },
});
