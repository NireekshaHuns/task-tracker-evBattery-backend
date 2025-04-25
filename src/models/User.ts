import { User as JsonUser, IUser } from "../database/jsonDB";

class User {
  _id: string;
  name: string;
  role: "submitter" | "approver";
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(userData: Omit<IUser, "_id" | "createdAt" | "updatedAt">) {
    this._id = "";
    this.name = userData.name;
    this.role = userData.role;
    this.username = userData.username;
    this.password = userData.password;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async findOne(query: Partial<IUser>): Promise<User | null> {
    const user = await JsonUser.findOne(query);
    if (!user) return null;

    return Object.assign(Object.create(User.prototype), user);
  }

  static async find(query: Partial<IUser>): Promise<User[]> {
    const users = await JsonUser.find(query);
    return users.map((user) =>
      Object.assign(Object.create(User.prototype), user)
    );
  }

  async save(): Promise<User> {
    if (!this._id) {
      // New user - create
      const userData = {
        name: this.name,
        role: this.role,
        username: this.username,
        password: this.password,
      };
      const newUser = await JsonUser.create(userData);
      Object.assign(this, newUser);
      return this;
    }
    // Existing user - no update functionality needed for this app
    return this;
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return JsonUser.comparePassword(this, candidatePassword);
  }
}

export default User;
