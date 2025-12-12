"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = () => {
    authClient.signUp.email(
      {
        email,
        name,
        password,
      },
      {
        onError: () => {
          window.alert("Something went wrong");
        },
        onSuccess: () => {
          window.alert("User created successfully");
        },
      }
    );
  };

  const onSingin = () => {
    authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onError: () => {
          window.alert("Something went wrong");
        },
        onSuccess: () => {
          window.alert("User created successfully");
        },
      }
    );
  };

  if (session) {
    return (
      <div>
        <p>Logged in as {session.user.name}</p>
        <Button onClick={() => authClient.signOut()}>signout</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 pt-4">
        <Input
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="pt-4"
        />
        <Input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <Button onClick={onSubmit}>create user</Button>
      </div>
      <div className="p-4 pt-5">
        <Input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <Button onClick={onSingin}>Signin</Button>
      </div>
    </div>
  );
}
